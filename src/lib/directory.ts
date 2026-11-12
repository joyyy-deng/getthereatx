import type { DirectoryTags, Post } from '../content/schema';
import type { DirectoryEntry } from '../content/sheet';
import { text } from './i18n';

/**
 * The Resources directory filters (Figma: Search, Ways of getting around, Who
 * are you?, Type of info), by their labels in directory-tags.json. Several
 * ticks in one group mean "any of these"; different groups all apply. They
 * live in the URL: /resources?mode=Biking|Walking&who=Commuter&q=bikeshare
 */
export interface DirectoryFilter {
  /** "Who are you?" tag labels. */
  who?: string | string[];
  /** "Ways of getting around" option labels. */
  mode?: string | string[];
  q: string;
}

const list = (v: string | string[] | undefined) => (v === undefined ? [] : Array.isArray(v) ? v : [v]);
const overlaps = (a: string[], b: string[]) => a.some((v) => b.includes(v));
const matches = (query: string, ...fields: string[]) => {
  const q = query.trim().toLowerCase();
  return !q || fields.some((s) => s.toLowerCase().includes(q));
};

/** Guides (posts) for the filters: "Who are you?" by audience, and the search words. */
export function filterGuides(posts: Post[], who: string | string[] | undefined, tags: DirectoryTags, q = ''): Post[] {
  const chosen = tags.forWho.tags.filter((t) => list(who).includes(t.label));
  return posts.filter(
    (p) =>
      (!chosen.length || chosen.some((t) => p.audiences.some((a) => t.audiences.includes(a)))) &&
      matches(q, text(p.title), text(p.summary)),
  );
}

/** Sheet entries that pass every filter, in sheet order. */
export function filterDirectory(entries: DirectoryEntry[], f: DirectoryFilter, tags: DirectoryTags): DirectoryEntry[] {
  const who = tags.forWho.tags.filter((t) => list(f.who).includes(t.label));
  const modes = tags.transportation.options.filter((o) => list(f.mode).includes(o.label));
  return entries.filter(
    (e) =>
      (!who.length || who.some((t) => overlaps(e.forWho, t.sheetForWho) || overlaps(e.types, t.sheetType))) &&
      (!modes.length || modes.some((o) => overlaps(e.types, o.sheetType))) &&
      matches(f.q, e.name, e.description),
  );
}
