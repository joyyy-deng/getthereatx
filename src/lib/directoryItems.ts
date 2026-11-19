import type { ConnectCard, Post, Resource, ResourceList, WpDirectory } from '../content/schema';
import type { Occurrence } from './recurrence';
import { groupTags, guideTags, labelsIn, tagLabels } from './directory';
import { cardDateText } from './eventText';
import { text } from './i18n';

// The Resources directory shows four kinds of things as the same card: the
// owner's resource list (websites), guides (blog posts), community events
// (events.json; each opens its event page) and community programs (the "Get
// there together" cards; each opens its program's site). Every card has the
// tags of the list's hierarchy, which the filters and the eyebrow use.

/** The list's tag that community events carry, and the one community programs carry. */
export const EVENT_TAG = 'HappeninginAustin';
export const PROGRAM_TAG = 'Community/gettinginvolved';

/** What a card shows, whatever it came from. */
export interface DirectoryItem {
  id: string;
  /** The tags the filters match on (the list's tags, as written). */
  tags: string[];
  /** The tags' display labels, for the search box. */
  tagLabels: string[];
  eyebrow?: string;
  title: string;
  /** Left out of the card when empty (the list has no descriptions of its own). */
  description?: string;
  /** Small print under the description (rows only), e.g. a venue. */
  meta?: string;
  /** A saved picture of the site, or of the photo; no picture shows a plain sky panel (never a mascot). */
  photo?: string;
  action?: { kind: 'out'; href: string; label: string; trackId: string } | { kind: 'in'; to: string; label: string };
}

/** "Ways of getting around" labels joined with " · ", else "Type of info" labels. */
function eyebrowFor(list: ResourceList, tags: string[]): string | undefined {
  const modes = labelsIn(list, tags, 'mode');
  return (modes.length ? modes : labelsIn(list, tags, 'type')).join(' · ') || undefined;
}

function base(list: ResourceList, tags: string[]) {
  const labels = tagLabels(list);
  const all = [...labelsIn(list, tags, 'mode'), ...labelsIn(list, tags, 'who'), ...labelsIn(list, tags, 'type')];
  return { tags, tagLabels: all.length ? all : tags.map((t) => labels[t] ?? t), eyebrow: eyebrowFor(list, tags) };
}

/** A resource from the list: the site's saved picture (`photo`) when it has one. */
export function listItem(list: ResourceList, r: ResourceList['resources'][number], linkLabel: string, photo?: string): DirectoryItem {
  return {
    id: `list:${r.id}`,
    ...base(list, r.tags),
    title: r.title,
    description: r.description,
    photo,
    action: { kind: 'out', href: r.url, label: linkLabel, trackId: `list:${r.id}` },
  };
}

export function guideItem(list: ResourceList, post: Post, labels: { guide: string; readGuide: string; watchVideo: string }): DirectoryItem {
  const video = !!post.video;
  const b = base(list, guideTags(list, post));
  return {
    id: `post:${post.id}`,
    ...b,
    eyebrow: b.eyebrow ?? labels.guide,
    title: text(post.title),
    description: text(post.summary),
    photo: post.image?.src,
    action: { kind: 'in', to: `/guides/${post.slug}`, label: video ? labels.watchVideo : labels.readGuide },
  };
}

/** A community event: its next date, opening its event page. */
export function eventItem(list: ResourceList, o: Occurrence, action: string, date: string): DirectoryItem {
  const e = o.event;
  const b = base(list, [EVENT_TAG]);
  return {
    id: `event:${e.id}`,
    ...b,
    eyebrow: [b.eyebrow, date].filter(Boolean).join(' · '),
    title: text(e.title),
    description: text(e.blurb),
    meta: e.venue.name,
    photo: e.image?.src,
    action: { kind: 'in', to: `/community/events/${e.slug}`, label: action },
  };
}

/** A community program (a "Get there together" card), opening its program's site. */
export function programItem(list: ResourceList, card: ConnectCard, resource: Resource): DirectoryItem {
  return {
    id: `program:${card.id}`,
    ...base(list, [PROGRAM_TAG]),
    title: text(card.title),
    description: resource.oneLiner,
    meta: resource.provider,
    photo: card.image.src,
    // Our own guide (Bike Bus) opens its rebuilt guide page, never the old getthereatx.com page.
    action: resource.postSlug
      ? { kind: 'in', to: `/guides/${resource.postSlug}`, label: resource.action }
      : { kind: 'out', href: resource.url, label: resource.action, trackId: resource.id },
  };
}

/**
 * An entry from WordPress (External resource, blog post or upcoming event).
 * Guides and events open their WordPress page; sites open in a new tab.
 */
export function wpItem(
  list: ResourceList,
  e: WpDirectory['entries'][number],
  labels: { linkLabel: string; guide: string; readGuide: string; watchVideo: string; eventAction: string },
  date?: string,
): DirectoryItem {
  // WordPress lists terms A–Z; put them in the filter tree's order (Rolling · Biking · Bus), as the list does.
  const tree = [...groupTags(list, 'mode'), ...groupTags(list, 'who'), ...groupTags(list, 'type')];
  const at = (t: string) => (tree.indexOf(t) + 1 || tree.length + 1);
  const sorted = [...e.tags].sort((a, b) => at(a) - at(b));
  const tags = e.kind === 'event' && !sorted.includes(EVENT_TAG) ? [EVENT_TAG, ...sorted] : sorted;
  const b = base(list, tags);
  const common = { id: `wp:${e.id}`, ...b, title: e.title, description: e.description || undefined, photo: e.photo };
  if (e.kind === 'site') return { ...common, action: { kind: 'out', href: e.url, label: labels.linkLabel, trackId: `wp:${e.id}` } };
  if (e.kind === 'event')
    return { ...common, eyebrow: [b.eyebrow, date].filter(Boolean).join(' · '), meta: e.venue, action: { kind: 'in', to: e.url, label: labels.eventAction } };
  return { ...common, eyebrow: b.eyebrow ?? labels.guide, action: { kind: 'in', to: e.url, label: e.video ? labels.watchVideo : labels.readGuide } };
}

/** Everything the directory cards are built from (Resources page; Home's "See what's going on"). */
export interface DirectorySources {
  list: ResourceList;
  copy: { linkLabel: string; eventAction: string; guidesLabel: string; readGuide: string; watchVideo: string };
  cards: ConnectCard[];
  resources: Resource[];
  /** Upcoming community events, one occurrence each. */
  events: Occurrence[];
  posts: Post[];
  /** Site address → its saved picture. */
  shareImages: Record<string, string>;
  /** Inside WordPress after the starter import: the directory from WP admin, which replaces the rest. */
  wp?: WpDirectory | null;
}

/** Every directory card, A–Z by title: sites, then programs, events (by date) and guides. */
export function directoryEntries(d: DirectorySources): DirectoryItem[] {
  const { copy, list } = d;
  const byTitle = (a: DirectoryItem, b: DirectoryItem) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' });
  const labels = { guide: copy.guidesLabel, readGuide: copy.readGuide, watchVideo: copy.watchVideo };
  if (d.wp) {
    const wpLabels = { ...labels, linkLabel: copy.linkLabel, eventAction: copy.eventAction };
    const of = (kind: string) => d.wp!.entries.filter((e) => e.kind === kind);
    const sites = of('site').map((e) => wpItem(list, e, wpLabels)).sort(byTitle);
    // Events come sorted by date from WordPress.
    const events = of('event').map((e) => wpItem(list, e, wpLabels, e.start ? cardDateText(new Date(e.start)) : undefined));
    // Blog posts lead, newest first (WordPress sends them by date; Joy 2026-11-18). Own-site External
    // resources (kind 'guide', id "resource-…") stay A–Z with the other resources.
    const isPost = (e: { id: string }) => e.id.startsWith('post-');
    const posts = d.wp.entries.filter(isPost).map((e) => wpItem(list, e, wpLabels));
    const guides = of('guide').filter((e) => !isPost(e)).map((e) => wpItem(list, e, wpLabels)).sort(byTitle);
    // Programs are External resources in WordPress too (tagged Community / getting involved).
    return [...posts, ...sites, ...events, ...guides];
  }
  const programs = d.cards.flatMap((c) => {
    const r = d.resources.find((x) => x.id === c.resourceId);
    return r ? [programItem(list, c, r)] : [];
  });
  const sites = list.resources.map((r) => listItem(list, r, copy.linkLabel, d.shareImages[r.url])).sort(byTitle);
  const events = d.events.map((o) => eventItem(list, o, copy.eventAction, cardDateText(o.start)));
  // Blog posts lead, newest first (Joy 2026-11-18).
  const when = (p: (typeof d.posts)[number]) => p.published ?? p.lastReviewed;
  const guides = [...d.posts].sort((a, b) => when(b).localeCompare(when(a))).map((p) => guideItem(list, p, labels));
  return [...guides, ...sites, ...programs.sort(byTitle), ...events];
}

/**
 * Home's "See what's going on in Austin." photo cards: the items picked in `featured`
 * (directory ids, in that order), else the first `count` Happening in Austin items with a picture.
 */
export function happeningItems(items: DirectoryItem[], featured: string[], count = 2): DirectoryItem[] {
  const picked = featured.flatMap((id) => items.filter((i) => i.id === id));
  if (picked.length) return picked.slice(0, count);
  return items.filter((i) => i.tags.includes(EVENT_TAG) && i.photo).slice(0, count);
}

/** One "New to this?" row picked on Home: a directory id plus the short row name and optional overrides. */
export interface HomeGuidePick {
  id: string;
  title: string;
  body?: string;
  image?: { src: string; alt: string };
  linkLabel?: string;
}

/**
 * Home's "New to this?" rows: the picked directory items in order (with their row names),
 * else every guide with "101" in its title, A–Z, named by its own title.
 */
export function newToThisItems(items: DirectoryItem[], picks: HomeGuidePick[]): { pick: HomeGuidePick; item: DirectoryItem }[] {
  const rows = picks.flatMap((pick) => items.filter((i) => i.id === pick.id).map((item) => ({ pick, item })));
  if (rows.length) return rows;
  return items.filter((i) => i.id.startsWith('post:') && /\b101\b/.test(i.title)).map((item) => ({ pick: { id: item.id, title: item.title }, item }));
}
