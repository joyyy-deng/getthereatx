import type { ConnectCard, Post, Resource, ResourceList } from '../content/schema';
import type { Occurrence } from './recurrence';
import { guideTags, labelsIn, tagLabels } from './directory';
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
    action: { kind: 'out', href: resource.url, label: resource.action, trackId: resource.id },
  };
}
