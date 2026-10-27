import type { DirectoryEntry } from '../content/sheet';

/**
 * The Resources directory filters, using the sheet's own "Type" and "For Who?"
 * values. They live in the URL: /resources?type=Biking&who=Commuters&q=bikeshare
 */
export interface DirectoryFilter {
  type?: string;
  who?: string;
  q: string;
}

/** Entries that pass every filter, in sheet order. */
export function filterDirectory(entries: DirectoryEntry[], f: DirectoryFilter): DirectoryEntry[] {
  const query = f.q.trim().toLowerCase();
  return entries.filter(
    (e) =>
      (!f.type || e.types.includes(f.type)) &&
      (!f.who || e.forWho.includes(f.who)) &&
      (!query || [e.name, e.description].some((s) => s.toLowerCase().includes(query))),
  );
}

/** Every "Type" and "For Who?" value in the sheet, in the order they first appear. */
export function directoryOptions(entries: DirectoryEntry[]) {
  const unique = (values: string[]) => [...new Set(values)];
  return {
    types: unique(entries.flatMap((e) => e.types)),
    forWho: unique(entries.flatMap((e) => e.forWho)),
  };
}
