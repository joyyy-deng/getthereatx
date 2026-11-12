import { z } from 'zod';
import { AUDIENCES, MODES, NEEDS, PLACE_CATEGORIES } from './taxonomies';

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
  /**
   * Template filled with the trip; only where verified to work. Fill-ins:
   * {from} {to} (place mapsQuery), {mode} (Google travelmode), {fromLatLng}
   * {toLatLng} ("30.26,-97.74"), {fromName} {toName}, {leaveAt} (ms since
   * 1970; empty = leave now). Empty fill-ins drop their parameter.
   */
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

/**
 * A block of a post's body. Text may contain [label](https://…) links and
 * **bold**; nothing else. Becomes the post content in WordPress.
 */
const PostBlock = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string().min(1) }),
  z.object({ type: z.literal('heading'), text: z.string().min(1) }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string().min(1)).min(1) }),
  z.object({ type: z.literal('image'), src: z.string().min(1), alt: z.string().min(1), caption: z.string().optional() }),
  /** Figma "Article/Tip callout": a mist box with a navy bar. `label` defaults to "Tip". */
  z.object({ type: z.literal('tip'), label: z.string().min(1).optional(), text: z.string().min(1) }),
  /** Figma "Article/Step": numbered squares, a title and one or more paragraphs each. */
  z.object({
    type: z.literal('steps'),
    items: z.array(z.object({ title: z.string().min(1), text: z.array(z.string().min(1)).min(1) })).min(1),
  }),
  /** Figma facts strip: label / value pairs. Three to a row on desktop; more start a new row. */
  z.object({
    type: z.literal('facts'),
    items: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).min(1),
  }),
  /** Figma "Article/Table": a caps header row, then rows; the first column is bold. */
  z.object({
    type: z.literal('table'),
    columns: z.array(z.string().min(1)).min(1),
    rows: z.array(z.array(z.string())).min(1),
  }),
  /** Figma "Article/Button primary". */
  z.object({ type: z.literal('button'), label: z.string().min(1), href: z.string().min(1) }),
]).refine((b) => b.type !== 'table' || b.rows.every((r) => r.length === b.columns.length), {
  message: 'every table row needs one cell per column',
});
export type PostBlock = z.infer<typeof PostBlock>;
export { PostBlock };

/**
 * getthereatx.com's blog categories (Posts → Categories in WP admin), copied
 * 2026-11-08. The client may rename, add or remove these; in WordPress they
 * come straight from the site, so only this file changes here.
 */
export const Category = z.object({ slug: z.string().regex(/^[a-z0-9-]+$/), name: z.string().min(1) });
export const Categories = z.array(Category).min(1);
export type Category = z.infer<typeof Category>;

/** An existing getthereatx.com blog post. Summaries are the post excerpts. */
export const Post = Meta.extend({
  title: L,
  summary: L,
  image: Img.optional(),
  /** The live post on getthereatx.com. */
  url: z.string().url(),
  /** The post's categories on getthereatx.com (slugs from categories.json); the first is shown on cards. */
  categories: z.array(z.string().min(1)).min(1),
  modes: z.array(Mode),
  /** Used by the Resources directory filters, alongside resources. */
  audiences: z.array(Audience).min(1),
  needs: z.array(Need).min(1),
  /** First published on getthereatx.com. */
  published: z.string().date().optional(),
  /** A video shown in the hero instead of the photo. */
  video: z.object({ youtubeId: z.string().regex(/^[\w-]{11}$/, 'the 11-character id from the YouTube link') }).optional(),
  /** "By …" in the meta line. Empty = the site name (pages.json guide.defaultAuthor). */
  author: z.string().min(1).optional(),
  /** The client wants no date on posts by default. true adds "Updated {month year}" (from lastReviewed). */
  showDate: z.boolean().optional(),
  /** The post's text, word for word, without the old pasted styling. Posts without it link to the live post. */
  body: z.array(PostBlock).optional(),
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
  /**
   * Event page (Figma "Community Event Detail Template"). All optional: a
   * section or fact only shows when it has text. In WordPress these are The
   * Events Calendar's own fields (cost, organizer) plus our "Event details"
   * ACF group.
   */
  cost: z.string().min(1).optional(),
  ages: z.string().min(1).optional(),
  registration: z.string().min(1).optional(),
  /** "Hosted by": organizer · partners, then a contact line. */
  organizer: z.object({ name: z.string().min(1), partners: z.string().min(1).optional() }).optional(),
  contact: z.string().min(1).optional(),
  /** "What to bring / What you will gain" bullets. */
  whatToBring: z.array(z.string().min(1)).min(1).optional(),
  accessibility: z.string().min(1).optional(),
  /**
   * "Getting there": any number of ways, each a label (Bus, Bike, Scooter,
   * Walk, Parking…) and the details. Figma shows three (BUS, BIKE, PARKING);
   * staff can add any others. Three to a row on desktop.
   */
  gettingThere: z.array(z.object({ label: z.string().min(1), details: z.string().min(1) })).min(1).optional(),
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
  /** The Transportation option this card selects (directory-tags.json). */
  transportation: z.string().min(1),
  image: Img.optional(),
});
export type ResourceModeCard = z.infer<typeof ResourceModeCard>;

/** "Which sounds most like you?" cards on Resources. */
export const Persona = z
  .object({
    id: z.string().min(1),
    title: L,
    body: L,
    /** Either go to a page, or set directory filters (tag / Transportation labels from directory-tags.json). */
    to: z.string().startsWith('/').optional(),
    filter: z.object({ who: z.string().min(1).optional(), mode: z.string().min(1).optional() }).optional(),
  })
  .refine((p) => !!p.to !== !!p.filter, { message: 'a persona needs exactly one of `to` or `filter`' });
export type Persona = z.infer<typeof Persona>;

const Text = z.string().min(1);

/** A link to another GetThereATX page, e.g. "/plan?to=mueller" or "#events". */
const PagePath = z.string().regex(/^[/#]/, 'start internal links with / or #');
/** Text set on separate lines in the design ("AUSTIN," / "YOUR WAY."). Joined with spaces where it wraps. */
const Lines = z.array(Text).min(1);
/** A big colored card that links somewhere ("See all guides", "Explore More"). */
const LinkCard = z.object({ title: Lines, to: PagePath });
/** "Get there together." band (Home and Community). Its cards are connect-cards.json. */
const Together = z.object({ title: Text, button: z.object({ label: Text, to: PagePath }) });

/**
 * The wording on each page: headings, intros and labels. Lists that have
 * their own records (resources, posts, events…) live in their own files.
 */
export const PageContent = z.object({
  home: z.object({
    hero: z.object({
      title: Lines,
      planTitle: Text,
      /** Screen-reader label for the round plan button. */
      button: Text,
      illustrationAlt: Text,
    }),
    guides: z.object({
      title: Lines,
      seeAll: LinkCard,
      /** Accordion rows. Each links to a live post (posts.json slug) or a registry resource. */
      items: z
        .array(
          z
            .object({
              id: Text,
              title: Text,
              postSlug: Text.optional(),
              resourceId: Text.optional(),
              /** Defaults to the post excerpt or the resource one-liner. */
              body: Text.optional(),
              /** Defaults to the post image. */
              image: Img.optional(),
              /** Defaults to "Read the guide" (post) or the resource action. */
              linkLabel: Text.optional(),
            })
            .refine((i) => !!i.postSlug !== !!i.resourceId, { message: 'an item needs exactly one of postSlug or resourceId' }),
        )
        .min(1),
    }),
    discover: z.object({
      title: Text,
      cards: z.array(z.object({ title: Text, image: Img, to: PagePath })).min(1),
      explore: LinkCard,
    }),
    together: Together,
  }),
  plan: z.object({
    title: Text,
    fromPlaceholder: Text,
    toPlaceholder: Text,
    /** Shown until both From and To are set. */
    emptyHint: Text,
    /** First choice of the departure menu; the rest are times every 15 minutes. */
    leaveNow: Text,
    /** Screen-reader name of the departure menu. */
    leaveLabel: Text,
    /** Under the route headline. {leave} is "now" or a time, {arrive} a time. */
    timing: Text,
    updateButton: Text,
    compareTitle: Text,
    /** Eyebrow after the mode name: "BIKING · SELECTED ROUTE". */
    selectedLabel: Text,
    /** {minutes} and {to} are filled in: "32 minutes to Mueller". */
    headline: Text,
  }),
  resources: z.object({
    hero: z.object({ title: Text, intro: Text, button: z.object({ label: Text, to: PagePath }) }),
    title: Text,
    allLabel: Text,
    /** First option of the "For who?" menu. */
    everyoneLabel: Text,
    noResults: Text,
    /** Action on each entry that has a link. */
    linkLabel: Text,
    /** The filter that shows guides (blog posts), and their card actions. */
    guidesLabel: Text,
    readGuide: Text,
    watchVideo: Text,
  }),
  students: z.object({
    title: Text,
    intro: Text,
    callout: z.object({ title: Text, body: Text, link: Text }),
  }),
  community: z.object({
    together: Together,
    events: z.object({
      title: Text,
      featuredLabel: Text,
      linkLabel: Text,
      empty: Text,
    }),
    explore: LinkCard,
  }),
  /** Blog pages (Figma "Article/blog Master template"). {n}, {date} and {author} are filled in. */
  guide: z.object({
    backLabel: Text,
    readTime: Text,
    updated: Text,
    byline: Text,
    defaultAuthor: Text,
    tipLabel: Text,
    relatedTitle: Text,
    cta: z.object({ title: Text, text: Text, button: Text, to: z.string().startsWith('/') }),
    readFullPost: Text,
  }),
  /** Community event pages (Figma "Community Event Detail Template"). */
  event: z.object({
    backLabel: Text,
    bringTitle: Text,
    hostedTitle: Text,
    accessibilityTitle: Text,
    gettingThereTitle: Text,
    labels: z.object({
      date: Text,
      time: Text,
      location: Text,
      cost: Text,
      ages: Text,
      registration: Text,
    }),
    bookButton: Text,
    calendarButton: Text,
    moreTitle: Text,
    viewEvent: Text,
  }),
  notFound: z.object({ title: Text, intro: Text }),
});
export type PageContent = z.infer<typeof PageContent>;

const SheetValues = z.array(Text);

/**
 * The Resources filters. The client's sheet has its own "For Who?" and "Type"
 * words; this says which of them each site tag and Transportation option covers,
 * so the site can use its own labels without changing the sheet.
 */
export const DirectoryTags = z.object({
  forWho: z.object({
    label: Text,
    tags: z
      .array(
        z.object({
          label: Text,
          sheetForWho: SheetValues.default([]),
          sheetType: SheetValues.default([]),
          /** Which guide (post) audiences this tag covers. */
          audiences: z.array(z.enum(AUDIENCES)).default([]),
        }),
      )
      .min(1),
  }),
  transportation: z.object({
    label: Text,
    options: z.array(z.object({ label: Text, sheetType: SheetValues.min(1) })).min(1),
  }),
});
export type DirectoryTags = z.infer<typeof DirectoryTags>;

/**
 * Colors and fonts (theme.json). Each color key is a CSS variable name without
 * the leading `--`; `use` tells an editor where it shows up. The site applies
 * these at load, so changing one value here (or in WordPress later) recolors
 * the site without touching components.
 */
export const Theme = z.object({
  font: z.object({
    sans: Text,
    mono: Text,
    /** Web font stylesheets to load, e.g. the Adobe Fonts kit. Only these hosts are allowed. */
    stylesheets: z
      .array(z.string().regex(/^https:\/\/(use\.typekit\.net|fonts\.googleapis\.com)\//, 'use an Adobe Fonts or Google Fonts URL'))
      .default([]),
  }),
  colors: z.record(
    z.string().regex(/^[a-z][a-z0-9-]*$/, 'use lowercase-and-dashes names'),
    z.object({ value: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use a 6-digit hex color like #17324d'), use: Text }),
  ),
});
export type Theme = z.infer<typeof Theme>;

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
