// Local JSON data source. src/data/wordpress.ts replaces this file later,
// reading /wp-json/wp/v2/... and /wp-json/tribe/events/v1/events.

import alertsJson from '../content/alerts.json';
import connectCardsJson from '../content/connect-cards.json';
import eventsJson from '../content/events.json';
import explorePlacesJson from '../content/explore-places.json';
import homeJson from '../content/home.json';
import personasJson from '../content/personas.json';
import placesJson from '../content/places.json';
import planModesJson from '../content/plan-modes.json';
import planPreferencesJson from '../content/plan-preferences.json';
import postsJson from '../content/posts.json';
import programsJson from '../content/programs.json';
import resourceModesJson from '../content/resource-modes.json';
import resourcesJson from '../content/resources.json';
import studentTabsJson from '../content/student-tabs.json';
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
} from '../content/schema';
import type {
  Alert,
  ConnectCard,
  ExplorePlace,
  HomeContent as HomeContentType,
  Meta,
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

// Parsing at load keeps the types honest; `npm run validate-content`
// catches the same errors before the build.
const resources = Resources.parse(resourcesJson);
const posts = Posts.parse(postsJson);
const events = Events.parse(eventsJson);
const programs = Programs.parse(programsJson);
const alerts = Alerts.parse(alertsJson);
const places = Places.parse(placesJson);
const planModes = PlanModes.parse(planModesJson);
const planPreferences = PlanPreferences.parse(planPreferencesJson);
const connectCards = ConnectCards.parse(connectCardsJson);
const explorePlaces = ExplorePlaces.parse(explorePlacesJson);
const studentTabs = StudentTabs.parse(studentTabsJson);
const resourceModes = ResourceModeCards.parse(resourceModesJson);
const personas = Personas.parse(personasJson);
const home = HomeContent.parse(homeJson);

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

export async function getHomeContent(): Promise<HomeContentType> {
  return home;
}
