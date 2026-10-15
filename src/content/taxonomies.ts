// Controlled vocabularies. These become WordPress taxonomies later:
// adding a value here is a data change, not a code change.

export const MODES = ['walk', 'bike', 'bus', 'rail', 'carpool', 'drive'] as const;
export type Mode = (typeof MODES)[number];

export const NEEDS = ['plan-route', 'check-conditions', 'learn-how', 'join-program', 'save-money'] as const;
export type Need = (typeof NEEDS)[number];

export const AUDIENCES = [
  'everyone',
  'commuter',
  'student',
  'visitor',
  'family',
  'senior',
  'new-to-transit',
  'accessibility',
] as const;
export type Audience = (typeof AUDIENCES)[number];

// Topic tags carried over from the current site's posts. Used to group posts
// (e.g. related posts); no Guides page is built.
export const POST_TOPICS = ['transit', 'bike', 'families', 'programs', 'news'] as const;
export type PostTopic = (typeof POST_TOPICS)[number];

export const MODE_LABELS: Record<Mode, string> = {
  walk: 'Walk',
  bike: 'Bike',
  bus: 'Bus',
  rail: 'Rail',
  carpool: 'Carpool',
  drive: 'Drive',
};

export const NEED_LABELS: Record<Need, string> = {
  'plan-route': 'Plan a route',
  'check-conditions': 'Check conditions',
  'learn-how': 'Learn how',
  'join-program': 'Join a program',
  'save-money': 'Save money',
};

// Labels match the Figma Resources filter chips.
export const AUDIENCE_LABELS: Record<Audience, string> = {
  everyone: 'Everyone',
  commuter: 'Commuter',
  student: 'University Student',
  visitor: 'Visiting Austin',
  family: 'Families',
  senior: 'Seniors',
  'new-to-transit': 'New to transit',
  accessibility: 'Accessibility',
};

/** The audience chips shown on Resources, in Figma order. */
export const AUDIENCE_FILTERS: Audience[] = ['commuter', 'student', 'visitor', 'family', 'senior', 'accessibility'];

/** Explore Austin categories (Figma Community tabs). */
export const PLACE_CATEGORIES = ['parks', 'arts', 'shopping', 'food'] as const;
export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  parks: 'Parks & Recreation',
  arts: 'Arts & Culture',
  shopping: 'Shopping',
  food: 'Food',
};
