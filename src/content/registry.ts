import type { z } from 'zod';
import {
  Alerts,
  ConnectCards,
  Events,
  ExplorePlaces,
  PageContent,
  Personas,
  Places,
  PlanModes,
  PlanPreferences,
  Posts,
  Programs,
  ResourceModeCards,
  Resources,
  StudentTabs,
} from './schema';

/**
 * Every content file in this folder and the schema it must match. The site and
 * `npm run validate-content` both read this list, so a new file is one line here.
 */
export const CONTENT_FILES = {
  pages: PageContent,
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
} as const;

export type ContentFile = keyof typeof CONTENT_FILES;
export type ContentOf<F extends ContentFile> = z.infer<(typeof CONTENT_FILES)[F]>;
