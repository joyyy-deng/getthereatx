import type { DirectoryTags } from '../content/schema';
import type { DirectoryEntry } from '../content/sheet';

/**
 * The Resources directory filters: a "For who?" tag and a Transportation option,
 * by their labels in directory-tags.json. They live in the URL:
 * /resources?who=Commuter&mode=Biking&q=bikeshare
 */
export interface DirectoryFilter {
  who?: string;
  mode?: string;
  q: string;
}

const overlaps = (a: string[], b: string[]) => a.some((v) => b.includes(v));

/** Entries that pass every filter, in sheet order. */
export function filterDirectory(entries: DirectoryEntry[], f: DirectoryFilter, tags: DirectoryTags): DirectoryEntry[] {
  const tag = tags.forWho.tags.find((t) => t.label === f.who);
  const option = tags.transportation.options.find((o) => o.label === f.mode);
  const query = f.q.trim().toLowerCase();
  return entries.filter(
    (e) =>
      (!tag || overlaps(e.forWho, tag.sheetForWho) || overlaps(e.types, tag.sheetType)) &&
      (!option || overlaps(e.types, option.sheetType)) &&
      (!query || [e.name, e.description].some((s) => s.toLowerCase().includes(query))),
  );
}
