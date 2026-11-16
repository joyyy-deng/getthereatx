import type { Post, ResourceList } from '../content/schema';

// The Resources directory filters come from the owner's resource list
// (content/resource-list.json): three groups of tags (Ways of getting around,
// Who are you?, Type of info). Parent tags contain their children: ticking
// "Rolling" also finds anything tagged Biking, Bikeshare, Scooters or E-scooters.
// Several ticks in one group mean "any of these"; different groups all apply.
// They live in the URL by tag, e.g. /resources?mode=Rolling|bus&who=Students&q=bike

export type FilterGroupId = ResourceList['groups'][number]['id'];
export const FILTER_GROUP_IDS: FilterGroupId[] = ['mode', 'who', 'type'];

export type DirectoryFilter = Record<FilterGroupId, string[]> & { q: string };

/** Tags a filter on `tag` covers: the tag itself and, for a parent, its children. */
export function coveredTags(list: ResourceList, tag: string): string[] {
  for (const g of list.groups)
    for (const t of g.tags) {
      if (t.tag === tag) return [t.tag, ...(t.children ?? []).map((c) => c.tag)];
      if (t.children?.some((c) => c.tag === tag)) return [tag];
    }
  return [tag];
}

/** Every filterable tag in a group, parents and children. */
export function groupTags(list: ResourceList, id: FilterGroupId): string[] {
  const g = list.groups.find((x) => x.id === id);
  return (g?.tags ?? []).flatMap((t) => [t.tag, ...(t.children ?? []).map((c) => c.tag)]);
}

/** A tag's display label, if it is in the hierarchy. */
export function tagLabels(list: ResourceList): Record<string, string> {
  return Object.fromEntries(
    list.groups.flatMap((g) => g.tags.flatMap((t) => [[t.tag, t.label], ...(t.children ?? []).map((c) => [c.tag, c.label])])),
  );
}

/** Tags with aliases applied (#Carpool/vanpool counts as #Carpool), keeping the originals. */
export function withAliases(list: ResourceList, tags: string[]): string[] {
  return [...new Set(tags.flatMap((t) => (list.tagAliases[t] ? [t, list.tagAliases[t]] : [t])))];
}

/** Does an item with these tags pass the three group filters? */
export function matchesTags(list: ResourceList, tags: string[], f: Pick<DirectoryFilter, FilterGroupId>): boolean {
  const have = new Set(withAliases(list, tags));
  return FILTER_GROUP_IDS.every((id) => {
    const chosen = f[id];
    return !chosen.length || chosen.some((c) => coveredTags(list, c).some((t) => have.has(t)));
  });
}

export function matchesQuery(query: string, ...fields: (string | undefined)[]): boolean {
  const q = query.trim().toLowerCase();
  return !q || fields.some((s) => s?.toLowerCase().includes(q));
}

/** The list's tags for a blog post, matched on its address; none when the list has no note for it. */
export function guideTags(list: ResourceList, post: Pick<Post, 'url'>): string[] {
  const norm = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  return list.guides.find((g) => norm(g.url) === norm(post.url))?.tags ?? [];
}

/** Labels of an item's tags within one group, in the order the item lists them. */
export function labelsIn(list: ResourceList, tags: string[], id: FilterGroupId): string[] {
  const inGroup = new Set(groupTags(list, id));
  const labels = tagLabels(list);
  return [...new Set(withAliases(list, tags).filter((t) => inGroup.has(t)).map((t) => labels[t]))];
}
