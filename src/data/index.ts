// The one data-access seam. Components import from here, never from JSON.
// To move to headless WordPress, point these exports at ./wordpress instead.
export {
  getAlerts,
  getConnectCards,
  getDirectory,
  getEvents,
  getExplorePlaces,
  getPageContent,
  getPlaces,
  getPlanConfig,
  getPost,
  getPosts,
  getPrograms,
  getResource,
  getResources,
  getResourcesPage,
  getStudentTabs,
  isLive,
} from './local';
export type { DateRange, PostFilter, ResourceFilter } from './local';
export type { Occurrence } from '../lib/recurrence';
export type { DirectoryEntry } from '../content/sheet';
