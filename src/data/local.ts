// Local JSON data source. src/data/wordpress.ts replaces this file later,
// reading /wp-json/wp/v2/... and /wp-json/tribe/events/v1/events.

import { CONTENT_FILES, type ContentFile, type ContentOf } from '../content/registry';
import { readTripPlanningSheet, type DirectoryEntry } from '../content/sheet';
import tripPlanningCsv from '../content/sheets/trip-planning.csv?raw';
import type {
  Alert,
  ConnectCard,
  ExplorePlace,
  Meta,
  PageContent,
  Persona,
  Place,
  PlanMode,
  PlanPreference,
  Post,
  Program,
  Resource,
  ResourceModeCard,
  StudentTab,
} from '../content/schema';
import type { Audience, Mode, Need, PostTopic } from '../content/taxonomies';
import { expandEvent, type Occurrence } from '../lib/recurrence';

// Every JSON file in src/content, bundled at build time.
const json = import.meta.glob<unknown>('../content/*.json', { eager: true, import: 'default' });

/** Read one content file and check it against its schema (see content/registry.ts). */
function load<F extends ContentFile>(file: F): ContentOf<F> {
  return CONTENT_FILES[file].parse(json[`../content/${file}.json`]) as ContentOf<F>;
}

// Parsing at load keeps the types honest; `npm run validate-content`
// catches the same errors before the build.
const pages = load('pages');
const resources = load('resources');
const posts = load('posts');
const events = load('events');
const programs = load('programs');
const alerts = load('alerts');
const places = load('places');
const planModes = load('plan-modes');
const planPreferences = load('plan-preferences');
const connectCards = load('connect-cards');
const explorePlaces = load('explore-places');
const studentTabs = load('student-tabs');
const resourceModes = load('resource-modes');
const personas = load('personas');
// Rows with errors are left out; `npm run validate-content` reports them.
const directory = readTripPlanningSheet(tripPlanningCsv).entries.filter((e) => e.name && e.description);

/** `?preview=1` shows drafts, so the future admin "Preview" button just works. */
function isPreview(): boolean {
  return typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('preview') === '1';
}

/** Show only published records where publishAt <= now < expiresAt. */
export function isLive(record: Meta, now = new Date()): boolean {
  if (record.status === 'archived') return false;
  if (record.status === 'draft') return isPreview();
  if (record.publishAt && new Date(record.publishAt) > now) return false;
  if (record.expiresAt && new Date(record.expiresAt) <= now) return false;
  return true;
}

export interface ResourceFilter {
  ids?: string[];
  mode?: Mode;
  need?: Need;
  audience?: Audience;
  query?: string;
}

export async function getResources(filter: ResourceFilter = {}): Promise<Resource[]> {
  const q = filter.query?.trim().toLowerCase();
  const list = resources.filter(
    (r) =>
      (!filter.ids || filter.ids.includes(r.id)) &&
      (!filter.mode || r.modes.includes(filter.mode)) &&
      (!filter.need || r.needs.includes(filter.need)) &&
      (!filter.audience || r.audiences.includes(filter.audience)) &&
      (!q || [r.title, r.provider, r.action, r.oneLiner].some((s) => s.toLowerCase().includes(q))),
  );
  // Keep the caller's order when asking for specific ids.
  return filter.ids ? filter.ids.map((id) => list.find((r) => r.id === id)).filter((r): r is Resource => !!r) : list;
}

export async function getResource(id: string): Promise<Resource | undefined> {
  return resources.find((r) => r.id === id);
}

export interface PostFilter {
  topic?: PostTopic;
  mode?: Mode;
  need?: Need;
  audience?: Audience;
}

export async function getPosts(filter: PostFilter = {}): Promise<Post[]> {
  return posts.filter(
    (p) =>
      isLive(p) &&
      (!filter.topic || p.topics.includes(filter.topic)) &&
      (!filter.mode || p.modes.includes(filter.mode)) &&
      (!filter.need || p.needs.includes(filter.need)) &&
      (!filter.audience || p.audiences.includes(filter.audience)),
  );
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((p) => p.slug === slug && isLive(p));
}

export interface DateRange {
  from: Date;
  to: Date;
}

/** Occurrences inside the range, with recurring records expanded into dates. */
export async function getEvents(range: DateRange): Promise<Occurrence[]> {
  return events
    .filter((e) => isLive(e))
    .flatMap(expandEvent)
    .filter((o) => o.end > range.from && o.start < range.to)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export async function getAlerts(now = new Date()): Promise<Alert[]> {
  return alerts.filter((a) => isLive(a, now));
}

export async function getPrograms(): Promise<Program[]> {
  return programs.filter((p) => isLive(p));
}

export async function getPlaces(): Promise<Place[]> {
  return places;
}

/** Mode cards and "What matters to you?" chips for Plan Your Trip. */
export async function getPlanConfig(): Promise<{ modes: PlanMode[]; preferences: PlanPreference[] }> {
  return { modes: planModes, preferences: planPreferences };
}

/** Students / Families / Senior Citizens cards (Home and Community). */
export async function getConnectCards(): Promise<ConnectCard[]> {
  return connectCards;
}

export async function getExplorePlaces(): Promise<ExplorePlace[]> {
  return explorePlaces;
}

export async function getStudentTabs(): Promise<StudentTab[]> {
  return studentTabs;
}

/** Mode cards and "Which sounds most like you?" cards on Resources. */
export async function getResourcesPage(): Promise<{ modes: ResourceModeCard[]; personas: Persona[] }> {
  return { modes: resourceModes, personas };
}

/** The Resources directory: every row of the client's "Trip Planning" sheet. */
export async function getDirectory(): Promise<DirectoryEntry[]> {
  return directory;
}

/** Headings, intros and labels for every page (pages.json). */
export async function getPageContent(): Promise<PageContent> {
  return pages;
}
