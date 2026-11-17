// Local JSON data source. src/data/wordpress.ts replaces this file later,
// reading /wp-json/wp/v2/... and /wp-json/tribe/events/v1/events.

import { CONTENT_FILES, type ContentFile, type ContentOf } from '../content/registry';
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
  ResourceList,
  ResourceModeCard,
  StudentTab,
  Theme,
  WpDirectory,
} from '../content/schema';
import { WpDirectory as WpDirectorySchema } from '../content/schema';
import type { Audience, Mode, Need } from '../content/taxonomies';
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
const categories = load('categories');
const shareImages = load('share-images');
const events = load('events');
const programs = load('programs');
const alerts = load('alerts');
const places = load('places');
const planModes = load('plan-modes');
const planPreferences = load('plan-preferences');
const busRoutes = load('bus-routes');
const connectCards = load('connect-cards');
const explorePlaces = load('explore-places');
const studentTabs = load('student-tabs');
const resourceModes = load('resource-modes');
const personas = load('personas');
const resourceList = load('resource-list');
const theme = load('theme');

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
  /** A category slug (categories.json). */
  category?: string;
  mode?: Mode;
  need?: Need;
  audience?: Audience;
}

export async function getPosts(filter: PostFilter = {}): Promise<Post[]> {
  return posts.filter(
    (p) =>
      isLive(p) &&
      (!filter.category || p.categories.includes(filter.category)) &&
      (!filter.mode || p.modes.includes(filter.mode)) &&
      (!filter.need || p.needs.includes(filter.need)) &&
      (!filter.audience || p.audiences.includes(filter.audience)),
  );
}

/** Blog category names by slug, as named on getthereatx.com. */
export async function getCategoryNames(): Promise<Record<string, string>> {
  return Object.fromEntries(categories.map((c) => [c.slug, c.name]));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((p) => p.slug === slug && isLive(p));
}

/**
 * One event by slug, with the date its page shows: the next one still to come,
 * or the last one if the event is over (so old links still work).
 */
export async function getEvent(slug: string, now = new Date()): Promise<Occurrence | undefined> {
  const event = events.find((e) => e.slug === slug && isLive(e, now));
  if (!event) return undefined;
  const dates = expandEvent(event);
  return dates.find((o) => o.end > now) ?? dates[dates.length - 1];
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

export interface BusLeg {
  number: string;
  name: string;
}

/** CapMetro routes for a trip, in riding order, plus a UT shuttle when one runs direct ([] when none is known). */
export async function getBusRoutes(): Promise<(fromId: string, toId: string) => { legs: BusLeg[]; ut: BusLeg[] }> {
  const legs = (numbers: string[] = []) => numbers.map((number) => ({ number, name: busRoutes.routes[number] ?? number }));
  return (fromId, toId) => ({
    legs: legs(busRoutes.trips[`${fromId}>${toId}`]),
    ut: legs(busRoutes.utTrips[`${fromId}>${toId}`]),
  });
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

/** The owner's resource list: directory entries, filter groups (tag hierarchy) and blog-post tags. */
export async function getResourceList(): Promise<ResourceList> {
  return resourceList;
}

let wpDirectory: WpDirectory | null = null;

/** Called by the WordPress entry when the plugin sends the directory (src/wp/main.tsx). */
export function setWpDirectory(raw: unknown): void {
  const parsed = WpDirectorySchema.safeParse(raw);
  if (parsed.success) wpDirectory = parsed.data;
  else console.warn('GetThereATX: the directory from WordPress did not match, using the built-in list.', parsed.error.issues);
}

/** The directory from WordPress (resources, posts, events), or null to use the built-in list. */
export async function getWpDirectory(): Promise<WpDirectory | null> {
  return wpDirectory;
}

/** Headings, intros and labels for every page (pages.json). */
export async function getPageContent(): Promise<PageContent> {
  return pages;
}

/** Colors and fonts (theme.json). Synchronous so the first paint already has them. */
export function getThemeNow(): Theme {
  return theme;
}

export async function getTheme(): Promise<Theme> {
  return theme;
}

/** Each Resources link's own preview picture (share-images.json), keyed by the link. */
export async function getShareImages(): Promise<Record<string, string>> {
  return Object.fromEntries(Object.entries(shareImages).map(([url, v]) => [url, v.src]));
}
