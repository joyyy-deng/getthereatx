// npm run validate-content
// Checks every content file against the zod schemas, plus rules the schemas
// can't see on their own (unique ids, event times). Exits 1 on any error.
import type { z } from 'zod';
import {
  Alerts,
  ConnectCards,
  Events,
  ExplorePlaces,
  HomeContent,
  Personas,
  Places,
  PlanModes,
  PlanPreferences,
  Posts,
  Programs,
  ResourceModeCards,
  Resources,
  StudentTabs,
} from '../src/content/schema';
import { load, type ContentFile } from './content';

const SCHEMAS: Record<ContentFile, z.ZodTypeAny> = {
  resources: Resources,
  posts: Posts,
  events: Events,
  programs: Programs,
  alerts: Alerts,
  places: Places,
  'plan-modes': PlanModes,
  'plan-preferences': PlanPreferences,
  'connect-cards': ConnectCards,
  'explore-places': ExplorePlaces,
  'student-tabs': StudentTabs,
  'resource-modes': ResourceModeCards,
  personas: Personas,
  home: HomeContent,
};

let errors = 0;
const fail = (file: string, msg: string) => {
  errors++;
  console.error(`  ✗ ${file}: ${msg}`);
};

for (const [file, schema] of Object.entries(SCHEMAS) as [ContentFile, z.ZodTypeAny][]) {
  const result = schema.safeParse(load(file));
  if (!result.success) {
    for (const issue of result.error.issues) fail(file, `[${issue.path.join('.')}] ${issue.message}`);
    continue;
  }
  // Most files are lists; home.json is a single object.
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

const home = HomeContent.safeParse(load('home'));
if (home.success) {
  const placeIds = new Set((load('places') as { id: string }[]).map((p) => p.id));
  const postSlugs = new Set((load('posts') as { slug: string }[]).map((p) => p.slug));
  for (const id of home.data.heroDestinations) if (!placeIds.has(id)) fail('home', `unknown place "${id}"`);
  for (const r of home.data.confidenceRows)
    if (!postSlugs.has(r.postSlug)) fail('home', `unknown post "${r.postSlug}"`);
}

if (errors) {
  console.error(`\n${errors} content error${errors === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log('\nAll content is valid.');
