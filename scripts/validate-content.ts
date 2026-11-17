// npm run validate-content
// Checks every content file against the zod schemas, plus rules the schemas
// can't see on their own (unique ids, event times). Exits 1 on any error.
import type { z } from 'zod';
import { CONTENT_FILES } from '../src/content/registry';
import { Events, PageContent, PlanModes, PlanPreferences, ResourceList } from '../src/content/schema';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTripPlanningSheet } from '../src/content/sheet';
import { CONTENT_DIR, FILES, load } from './content';

let errors = 0;
const fail = (file: string, msg: string) => {
  errors++;
  console.error(`  ✗ ${file}: ${msg}`);
};

for (const file of FILES) {
  const result = (CONTENT_FILES[file] as z.ZodTypeAny).safeParse(load(file));
  if (!result.success) {
    for (const issue of result.error.issues) fail(file, `[${issue.path.join('.')}] ${issue.message}`);
    continue;
  }
  // Most files are lists; pages.json is a single object.
  // Plan cards may share a mode (each then needs its own `key`): keys must be unique.
  const records = (Array.isArray(result.data) ? result.data : [result.data]).map((r) =>
    file === 'plan-modes' ? { id: (r as { key?: string; id: string }).key ?? (r as { id: string }).id } : r,
  ) as { id?: string; slug?: string }[];

  for (const key of ['id', 'slug'] as const) {
    const seen = new Set<string>();
    for (const r of records) {
      const v = r[key];
      if (v === undefined) continue;
      if (seen.has(v)) fail(file, `duplicate ${key} "${v}"`);
      seen.add(v);
    }
  }

  if (file === 'events') {
    for (const e of result.data as z.infer<typeof Events>) {
      if (new Date(e.end) <= new Date(e.start)) fail(file, `${e.id}: end is not after start`);
      if (e.recurrence && e.recurrence.until < e.start.slice(0, 10))
        fail(file, `${e.id}: recurrence ends before it starts`);
    }
  }

  console.log(`  ✓ ${file}: ${records.length} record${records.length === 1 ? '' : 's'}`);
}

// Every resourceId used on Plan Your Trip must exist in the registry.
const resourceIds = new Set((load('resources') as { id: string }[]).map((r) => r.id));
const planModes = PlanModes.safeParse(load('plan-modes'));
const planPrefs = PlanPreferences.safeParse(load('plan-preferences'));
if (planModes.success && planPrefs.success) {
  const used = [
    ...planModes.data.flatMap((m) =>
      [m.primary, m.airportPrimary, m.longRide, ...m.secondary].filter(Boolean).map((l) => l!.resourceId),
    ),
    ...planPrefs.data.flatMap((p) => [...p.resourceIds, ...(p.studentResourceIds ?? [])]),
  ];
  for (const id of used) if (!resourceIds.has(id)) fail('plan', `unknown resourceId "${id}"`);
}

// Page content that points at registry rows.
const pageRefs = [
  ...(load('connect-cards') as { resourceId: string }[]).map((c) => c.resourceId),
  ...(load('student-tabs') as { resourceIds: string[] }[]).flatMap((t) => t.resourceIds),
];
for (const id of pageRefs) if (!resourceIds.has(id)) fail('pages', `unknown resourceId "${id}"`);

// Posts use getthereatx.com's own categories, listed in categories.json.
const categorySlugs = new Set((load('categories') as { slug: string }[]).map((c) => c.slug));
for (const p of load('posts') as { slug: string; categories?: string[] }[]) {
  for (const c of p.categories ?? []) if (!categorySlugs.has(c)) fail('posts', `${p.slug}: unknown category "${c}" (add it to categories.json)`);
}

const pages = PageContent.safeParse(load('pages'));
if (pages.success) {
  // Home's "New to this?" and "See what's going on" pick Resources directory items by id
  // (lib/directoryItems.ts): post:<post id>, list:<resource-list id>, event:<id>, program:<connect card id>.
  const directoryIds = new Set([
    ...(load('posts') as { id: string }[]).map((p) => `post:${p.id}`),
    ...(load('resource-list') as { resources: { id: string }[] }).resources.map((r) => `list:${r.id}`),
    ...(load('events') as { id: string }[]).map((e) => `event:${e.id}`),
    ...(load('connect-cards') as { id: string }[]).map((c) => `program:${c.id}`),
  ]);
  for (const { id } of pages.data.home.guides.featured)
    if (!directoryIds.has(id)) fail('pages', `home guides: no directory item "${id}"`);
  for (const id of pages.data.home.discover.featured)
    if (!directoryIds.has(id)) fail('pages', `home discover: no directory item "${id}"`);
}

// Images live in the repo (public/), never on another site: outside images
// break when that site moves or deletes them, as getthereatx.com uploads did.
for (const file of FILES) {
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}.${i}`));
    else if (v && typeof v === 'object')
      for (const [k, x] of Object.entries(v)) {
        if (k === 'src' && typeof x === 'string' && /^https?:/.test(x))
          fail(file, `[${path}.src] image is on another site; save it under public/images/ instead: ${x}`);
        walk(x, `${path}.${k}`);
      }
  };
  walk(load(file), file);
}

// The client's Trip Planning sheet (Resources directory). Errors fail the build;
// warnings list cells to fix in the Google Sheet.
const sheet = readTripPlanningSheet(readFileSync(join(CONTENT_DIR, 'sheets', 'trip-planning.csv'), 'utf8'));
for (const e of sheet.errors) fail('sheets/trip-planning.csv', e);
if (!sheet.errors.length) console.log(`  ✓ sheets/trip-planning.csv: ${sheet.entries.length} rows`);
if (sheet.warnings.length) {
  console.warn(`\n  ${sheet.warnings.length} things to fix in the Trip Planning sheet:`);
  for (const w of sheet.warnings) console.warn(`  ! ${w}`);
}

// The owner's resource list: tags on notes should be in the tag hierarchy (warnings, not
// errors: the list is hers), every blog note should match a post, and the other
// content files that name filters must use tags that exist.
const list = ResourceList.safeParse(load('resource-list'));
if (list.success) {
  const { groups, resources, guides, tagAliases } = list.data;
  const tagKeys = new Set(groups.flatMap((g) => g.tags.flatMap((t) => [t.tag, ...(t.children ?? []).map((c) => c.tag)])));
  const seenUrls = new Map<string, string>();
  for (const r of resources) {
    const key = r.url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
    if (seenUrls.has(key)) console.warn(`  ! resource-list: "${r.title}" and "${seenUrls.get(key)}" have the same link`);
    seenUrls.set(key, r.title);
  }
  for (const rec of [...resources, ...guides]) {
    for (const t of rec.tags) {
      if (tagAliases[t] && !tagKeys.has(tagAliases[t])) fail('resource-list', `${rec.title}: alias #${t} points at unknown tag #${tagAliases[t]}`);
      else if (!tagKeys.has(t) && !tagAliases[t]) console.warn(`  ! resource-list: ${rec.title}: tag #${t} is not in the tag hierarchy, so no filter finds it`);
    }
  }
  const postUrls = new Set((load('posts') as { url: string }[]).map((p) => p.url.toLowerCase().replace(/\/+$/, '')));
  for (const g of guides)
    if (!postUrls.has(g.url.toLowerCase().replace(/\/+$/, ''))) fail('resource-list', `blog note "${g.title}": no post with the address ${g.url}`);
  for (const p of postUrls)
    if (!guides.some((g) => g.url.toLowerCase().replace(/\/+$/, '') === p)) console.warn(`  ! resource-list: no blog note for the post ${p}, so it has no tags`);

  const modeTags = new Set(groups.find((g) => g.id === 'mode')!.tags.flatMap((t) => [t.tag, ...(t.children ?? []).map((c) => c.tag)]));
  const whoTags = new Set(groups.find((g) => g.id === 'who')!.tags.map((t) => t.tag));
  for (const m of load('resource-modes') as { mode: string; transportation: string }[])
    if (!modeTags.has(m.transportation)) fail('resource-modes', `${m.mode}: no "Ways of getting around" tag "${m.transportation}"`);
  for (const p of load('personas') as { id: string; filter?: { who?: string; mode?: string } }[]) {
    if (p.filter?.who && !whoTags.has(p.filter.who)) fail('personas', `${p.id}: no "Who are you?" tag "${p.filter.who}"`);
    if (p.filter?.mode && !modeTags.has(p.filter.mode)) fail('personas', `${p.id}: no "Ways of getting around" tag "${p.filter.mode}"`);
  }
}

// Bus route numbers come from one CapMetro schedule (bus-routes.json). CapMetro changes
// service in January, May/June and August; past the feed's end date the numbers may be stale.
{
  const { source } = load('bus-routes') as { source: string };
  const end = source.match(/to (\d{4})(\d{2})(\d{2})/);
  if (end && new Date(`${end[1]}-${end[2]}-${end[3]}T23:59:59`) < new Date())
    console.warn(
      `  ! bus-routes: CapMetro's schedule ended ${end[1]}-${end[2]}-${end[3]}. Download the new feed and run scripts/build-bus-routes.py (see its first lines).`,
    );
}

if (errors) {
  console.error(`\n${errors} content error${errors === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log('\nAll content is valid.');
