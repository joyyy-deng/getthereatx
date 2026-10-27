// npm run validate-content
// Checks every content file against the zod schemas, plus rules the schemas
// can't see on their own (unique ids, event times). Exits 1 on any error.
import type { z } from 'zod';
import { CONTENT_FILES } from '../src/content/registry';
import { DirectoryTags, Events, PageContent, PlanModes, PlanPreferences } from '../src/content/schema';
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
  const records = (Array.isArray(result.data) ? result.data : [result.data]) as { id?: string; slug?: string }[];

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

const pages = PageContent.safeParse(load('pages'));
if (pages.success) {
  const postSlugs = new Set((load('posts') as { slug: string }[]).map((p) => p.slug));
  const home = pages.data.home;
  for (const r of home.confidence.rows)
    if (!postSlugs.has(r.postSlug)) fail('pages', `home: unknown post "${r.postSlug}"`);
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

// Tags and Transportation options must point at words the sheet really uses,
// and anything the site filters by must be one of those labels.
const sheetTypes = new Set(sheet.entries.flatMap((e) => e.types));
const sheetWho = new Set(sheet.entries.flatMap((e) => e.forWho));
const tags = DirectoryTags.safeParse(load('directory-tags'));
if (tags.success) {
  const { forWho, transportation } = tags.data;
  for (const t of forWho.tags) {
    for (const v of t.sheetForWho)
      if (!sheetWho.has(v)) fail('directory-tags', `tag "${t.label}": no "For Who?" value "${v}" in the sheet`);
    for (const v of t.sheetType)
      if (!sheetTypes.has(v)) fail('directory-tags', `tag "${t.label}": no "Type" value "${v}" in the sheet`);
  }
  for (const o of transportation.options)
    for (const v of o.sheetType)
      if (!sheetTypes.has(v)) fail('directory-tags', `option "${o.label}": no "Type" value "${v}" in the sheet`);

  // Sheet words no tag or option covers can't be filtered to (fine, but worth knowing).
  const coveredWho = new Set(forWho.tags.flatMap((t) => t.sheetForWho));
  const coveredTypes = new Set([...forWho.tags, ...transportation.options].flatMap((x) => x.sheetType));
  const loose = [
    ...[...sheetWho].filter((v) => !coveredWho.has(v)).map((v) => `"For Who?" value "${v}"`),
    ...[...sheetTypes].filter((v) => !coveredTypes.has(v)).map((v) => `"Type" value "${v}"`),
  ];
  for (const l of loose) console.warn(`  ! directory-tags: no tag or option covers the sheet's ${l}`);

  const tagLabels = new Set(forWho.tags.map((t) => t.label));
  const modeLabels = new Set(transportation.options.map((o) => o.label));
  for (const m of load('resource-modes') as { mode: string; transportation: string }[])
    if (!modeLabels.has(m.transportation))
      fail('resource-modes', `${m.mode}: no Transportation option "${m.transportation}"`);
  for (const p of load('personas') as { id: string; filter?: { who?: string; mode?: string } }[]) {
    if (p.filter?.who && !tagLabels.has(p.filter.who)) fail('personas', `${p.id}: no tag "${p.filter.who}"`);
    if (p.filter?.mode && !modeLabels.has(p.filter.mode))
      fail('personas', `${p.id}: no Transportation option "${p.filter.mode}"`);
  }
}

if (errors) {
  console.error(`\n${errors} content error${errors === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log('\nAll content is valid.');
