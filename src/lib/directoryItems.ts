import type { ConnectCard, Post, Resource } from '../content/schema';
import type { Occurrence } from './recurrence';
import type { DirectoryEntry } from '../content/sheet';
import { text } from './i18n';

// The Resources directory shows four kinds of things as the same card: rows
// from the client's Trip Planning sheet (websites), guides (blog posts),
// community events (events.json; each opens its event page) and community
// programs (the "Get there together" cards: Student Carpooling, Senior
// Citizens, Families; each opens its program's site).

/** What a card shows, whatever it came from. */
export interface DirectoryItem {
  id: string;
  eyebrow?: string;
  title: string;
  description: string;
  /** Small print under the description (rows only), e.g. who it's for. */
  meta?: string;
  /** A photo, or a mascot drawn on sky (the sheet has no photos). */
  art: { photo: string } | { mascot?: string };
  action?: { kind: 'out'; href: string; label: string; trackId: string } | { kind: 'in'; to: string; label: string };
}

// The mascot for a sheet entry's first matching type (or plain sky).
const MASCOTS: [type: string, src: string][] = [
  ['Public Transit', '/images/mascots/mode-bus.svg'],
  ['Biking', '/images/mascots/mode-bike.svg'],
  ['Walking', '/images/mascots/mode-walk.svg'],
  ['Carpooling, Van or Car/Rideshare', '/images/mascots/mode-bus-walk.svg'],
];

/** A sheet row: the site's own preview picture when it has one (`photo`), else a mascot. */
export function sheetItem(entry: DirectoryEntry, linkLabel: string, photo?: string): DirectoryItem {
  return {
    id: `sheet:${entry.id}`,
    eyebrow: entry.types.join(' · ') || undefined,
    title: entry.name,
    description: entry.description,
    meta: entry.forWho.join(' · ') || undefined,
    art: photo ? { photo } : { mascot: MASCOTS.find(([type]) => entry.types.includes(type))?.[1] },
    action: entry.url ? { kind: 'out', href: entry.url, label: linkLabel, trackId: `sheet:${entry.id}` } : undefined,
  };
}

export function guideItem(
  post: Post,
  labels: { guide: string; readGuide: string; watchVideo: string },
  categoryNames: Record<string, string>,
): DirectoryItem {
  const video = !!post.video;
  return {
    id: `post:${post.id}`,
    eyebrow: [labels.guide, video ? 'Video' : undefined, categoryNames[post.categories[0]]].filter(Boolean).join(' · '),
    title: text(post.title),
    description: text(post.summary),
    art: post.image ? { photo: post.image.src } : {},
    action: { kind: 'in', to: `/guides/${post.slug}`, label: video ? labels.watchVideo : labels.readGuide },
  };
}

/** A community event: its next date, opening its event page. */
export function eventItem(o: Occurrence, labels: { eyebrow: string; action: string }, date: string): DirectoryItem {
  const e = o.event;
  return {
    id: `event:${e.id}`,
    eyebrow: `${labels.eyebrow} · ${date}`,
    title: text(e.title),
    description: text(e.blurb),
    meta: e.venue.name,
    art: e.image ? { photo: e.image.src } : {},
    action: { kind: 'in', to: `/community/events/${e.slug}`, label: labels.action },
  };
}

/** A community program (a "Get there together" card), opening its program's site. */
export function programItem(card: ConnectCard, resource: Resource, eyebrow: string): DirectoryItem {
  return {
    id: `program:${card.id}`,
    eyebrow: `${eyebrow} · ${text(card.body)}`,
    title: text(card.title),
    description: resource.oneLiner,
    meta: resource.provider,
    art: { photo: card.image.src },
    action: { kind: 'out', href: resource.url, label: resource.action, trackId: resource.id },
  };
}
