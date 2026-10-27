import { z } from 'zod';
import { AUDIENCES, MODES, NEEDS, PLACE_CATEGORIES, POST_TOPICS } from './taxonomies';

// Schemas are the contract. Each one maps 1:1 to a WordPress custom post type
// plus ACF field group, and later validates admin form input too.

/** Bilingual text. Spanish is optional and falls back to English. */
export const L = z.object({ en: z.string().min(1), es: z.string().min(1).optional() });
export type L = z.infer<typeof L>;

/** Images must carry alt text. */
export const Img = z.object({ src: z.string().min(1), alt: z.string().min(1) });
export type Img = z.infer<typeof Img>;

const Mode = z.enum(MODES);
const Need = z.enum(NEEDS);
const Audience = z.enum(AUDIENCES);

/** Publishing metadata on every record except Resource. */
export const Meta = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(['draft', 'published', 'archived']),
  publishAt: z.string().datetime({ offset: true }).optional(),
  expiresAt: z.string().datetime({ offset: true }).optional(),
  lastReviewed: z.string().date(),
  owner: z.string().optional(),
});
export type Meta = z.infer<typeof Meta>;

/** A link to an outside tool. Plain English strings, no translations. */
export const Resource = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  provider: z.string().min(1),
  /** Verb-first button label: "Find a carpool partner" */
  action: z.string().min(1),
  /** What you'll find there, 15 words or fewer. */
  oneLiner: z
    .string()
    .min(1)
    .refine((s) => s.trim().split(/\s+/).length <= 15, 'oneLiner must be 15 words or fewer'),
  url: z.string().url(),
  /** Template with {from} {to}; only where verified to work. */
  deepLink: z.string().optional(),
  modes: z.array(Mode).min(1),
  needs: z.array(Need).min(1),
  audiences: z.array(Audience).min(1),
  bestOn: z.enum(['phone', 'desktop', 'any']).optional(),
  /** Lives on getthereatx.com. */
  internal: z.boolean().optional(),
  lastChecked: z.string().date(),
});
export type Resource = z.infer<typeof Resource>;

/** An existing getthereatx.com blog post. Summaries are the post excerpts. */
export const Post = Meta.extend({
  title: L,
  summary: L,
  image: Img.optional(),
  /** The live post on getthereatx.com. */
  url: z.string().url(),
  topics: z.array(z.enum(POST_TOPICS)).min(1),
  modes: z.array(Mode),
  /** Used by the Resources directory filters, alongside resources. */
  audiences: z.array(Audience).min(1),
  needs: z.array(Need).min(1),
});
export type Post = z.infer<typeof Post>;

const Recurrence = z.object({
  freq: z.enum(['weekly', 'monthly']),
  /** RRULE-style days: "WE", or "-1SU" for the last Sunday of the month. */
  byDay: z.array(z.string().regex(/^(-?[1-5])?(MO|TU|WE|TH|FR|SA|SU)$/)).optional(),
  until: z.string().date(),
});

export const Event = Meta.extend({
  title: L,
  /** First occurrence. Recurring events repeat this time slot. */
  start: z.string().datetime({ offset: true }),
  end: z.string().datetime({ offset: true }),
  venue: z.object({ name: z.string().min(1), address: z.string().min(1) }),
  image: Img.optional(),
  blurb: L,
  url: z.string().url().optional(),
  recurrence: Recurrence.optional(),
  gettingThere: z.array(z.object({ mode: Mode, note: L })).optional(),
  tags: z.array(z.string()),
});
export type Event = z.infer<typeof Event>;

export const Program = Meta.extend({
  title: L,
  oneLiner: L,
  provider: z.string().min(1),
  howToGet: z.enum(['link', 'email', 'request-form']),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
  eligibility: L.optional(),
  modes: z.array(Mode),
}).refine((p) => (p.howToGet === 'email' ? !!p.email : !!p.url), {
  message: 'email programs need an email; link and request-form programs need a url',
});
export type Program = z.infer<typeof Program>;

export const Alert = Meta.extend({
  message: L,
  severity: z.enum(['info', 'advisory', 'disruption']),
  link: z.object({ label: L, url: z.string().url() }).optional(),
  placement: z.array(z.enum(['sitewide', 'plan', 'events'])).min(1),
  expiresAt: z.string().datetime({ offset: true }),
});
export type Alert = z.infer<typeof Alert>;

/** A fixed From/To choice on Plan Your Trip. No free-text addresses. */
export const Place = z.object({
  id: z.string().min(1),
  name: L,
  kind: z.enum(['neighborhood', 'destination']),
  centroid: z.object({ lat: z.number(), lng: z.number() }),
  /** [lat, lng] ring drawn on the map. Simplified from City of Austin boundaries, or hand-traced (see cityArea). */
  polygon: z
    .array(z.tuple([z.number(), z.number()]))
    .min(3)
    .optional(),
  /** The City boundary the polygon came from. */
  cityArea: z.string().optional(),
  /** Sent to Google Maps, e.g. "Mueller, Austin, TX". */
  mapsQuery: z.string().min(1),
  /** Typeahead matches: "UT", "campus", "SoCo". */
  aliases: z.array(z.string()),
  tags: z.array(z.enum(['student', 'family', 'event-venue'])).optional(),
});
export type Place = z.infer<typeof Place>;

/** A hand-off link on a mode card. URLs always come from the resource registry. */
const HandoffLink = z.object({
  resourceId: z.string().min(1),
  label: L,
  /** Fills the resource's deepLink with this trip, e.g. Google Maps `bicycling`. */
  travelmode: z.enum(['walking', 'bicycling', 'transit', 'driving']).optional(),
});
export type HandoffLink = z.infer<typeof HandoffLink>;

/** One comparison card on Plan Your Trip (Bike, Bus + walk, ...). */
export const PlanMode = z.object({
  id: z.enum(MODES),
  title: L,
  image: Img.optional(),
  /** Trait shown above the time, e.g. "Less effort, more waiting". */
  eyebrow: L,
  effort: L,
  cost: L,
  primary: HandoffLink,
  /** Replaces `primary` when either end of the trip is the airport. */
  airportPrimary: HandoffLink.optional(),
  secondary: z.array(HandoffLink).max(2),
  /** Bike only: the one link shown when the trip is too long to ride (over 8 mi). */
  longRide: HandoffLink.optional(),
  /** Show the "Earn $5 for this trip with CTX GO" pill. */
  ctxGo: z.boolean(),
});
export type PlanMode = z.infer<typeof PlanMode>;

/** A "What matters to you?" chip. */
export const PlanPreference = z.object({
  id: z.string().min(1),
  label: L,
  /** Modes from best to worst for this preference. */
  ranking: z.array(z.enum(MODES)).min(1),
  /** Resource lines added under the top card. */
  resourceIds: z.array(z.string()),
  /** Extra lines when either place is tagged `student`. */
  studentResourceIds: z.array(z.string()).optional(),
});
export type PlanPreference = z.infer<typeof PlanPreference>;

/** Students / Families / Senior Citizens cards on Home and Community. */
export const ConnectCard = z.object({
  id: z.string().min(1),
  title: L,
  body: L,
  image: Img,
  resourceId: z.string().min(1),
});
export type ConnectCard = z.infer<typeof ConnectCard>;

/** Explore Austin cards on Community. */
export const ExplorePlace = z.object({
  id: z.string().min(1),
  name: L,
  categories: z.array(z.enum(PLACE_CATEGORIES)).min(1),
  image: Img,
  url: z.string().url(),
  provider: z.string().min(1),
});
export type ExplorePlace = z.infer<typeof ExplorePlace>;

/** A tab on the Student resources page. */
export const StudentTab = z.object({
  id: z.string().min(1),
  label: L,
  resourceIds: z.array(z.string().min(1)).min(1),
});
export type StudentTab = z.infer<typeof StudentTab>;

/** Mode cards ("Bus", "Bike/Scooter/Skate", ...) on Resources. Each filters the directory. */
export const ResourceModeCard = z.object({
  mode: z.enum(MODES),
  title: L,
  /** The Trip Planning sheet's "Type" value this card filters by. */
  sheetType: z.string().min(1),
  image: Img.optional(),
});
export type ResourceModeCard = z.infer<typeof ResourceModeCard>;

/** "Which sounds most like you?" cards on Resources. */
export const Persona = z
  .object({
    id: z.string().min(1),
    title: L,
    body: L,
    /** Either go to a page, or set a directory filter using the sheet's own values. */
    to: z.string().startsWith('/').optional(),
    filter: z.object({ forWho: z.string().min(1).optional(), type: z.string().min(1).optional() }).optional(),
  })
  .refine((p) => !!p.to !== !!p.filter, { message: 'a persona needs exactly one of `to` or `filter`' });
export type Persona = z.infer<typeof Persona>;

const Text = z.string().min(1);
/** Eyebrow + title (+ optional intro) above a section. */
const SectionText = z.object({ eyebrow: Text, title: Text, intro: Text.optional() });

/**
 * The wording on each page: headings, intros and labels. Lists that have
 * their own records (resources, posts, events…) live in their own files.
 */
export const PageContent = z.object({
  home: z.object({
    hero: z.object({
      /** One string per line; lines join with a space on phones. */
      title: z.array(Text).min(1),
      intro: Text,
      button: Text,
    }),
    confidence: SectionText.extend({
      /** Each row links to a live post (posts.json slug). */
      rows: z.array(z.object({ label: Text, postSlug: Text })).min(1),
    }),
    connect: SectionText,
  }),
  plan: z.object({
    title: Text,
    preferencesTitle: Text,
    rideHome: z.object({ lead: Text, link: Text }),
    estimateNote: Text,
  }),
  resources: z.object({
    modes: SectionText,
    personas: SectionText,
    searchLabel: Text,
    searchPlaceholder: Text,
    noResults: Text,
    /** Button on each directory row that has a link. */
    linkLabel: Text,
  }),
  students: z.object({
    title: Text,
    intro: Text,
    callout: z.object({ title: Text, body: Text, link: Text }),
  }),
  community: z.object({
    hero: SectionText,
    events: SectionText.extend({ empty: Text }),
    explore: SectionText,
  }),
  notFound: z.object({ title: Text, intro: Text }),
});
export type PageContent = z.infer<typeof PageContent>;

export const Resources = z.array(Resource);
export const ConnectCards = z.array(ConnectCard);
export const ExplorePlaces = z.array(ExplorePlace);
export const StudentTabs = z.array(StudentTab);
export const ResourceModeCards = z.array(ResourceModeCard);
export const Personas = z.array(Persona);
export const Places = z.array(Place);
export const PlanModes = z.array(PlanMode);
export const PlanPreferences = z.array(PlanPreference);
export const Posts = z.array(Post);
export const Events = z.array(Event);
export const Programs = z.array(Program);
export const Alerts = z.array(Alert);
