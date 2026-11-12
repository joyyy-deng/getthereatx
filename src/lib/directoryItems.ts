import type { Post } from '../content/schema';
import type { DirectoryEntry } from '../content/sheet';
import { text } from './i18n';

// The Resources directory shows two kinds of things as the same card: rows
// from the client's Trip Planning sheet, and guides (blog posts).

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

export function sheetItem(entry: DirectoryEntry, linkLabel: string): DirectoryItem {
  return {
    id: `sheet:${entry.id}`,
    eyebrow: entry.types.join(' · ') || undefined,
    title: entry.name,
    description: entry.description,
    meta: entry.forWho.join(' · ') || undefined,
    art: { mascot: MASCOTS.find(([type]) => entry.types.includes(type))?.[1] },
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
