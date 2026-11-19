import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { DirectoryEntryCard } from '../components/resources/DirectoryEntryCard';
import { DirectoryFilters } from '../components/resources/DirectoryFilters';
import { PageLoading, Pagination } from '../components/ui';
import { Arrow } from '../components/ui/Arrow';
import { PageLink } from '../components/ui/PageLink';
import { getConnectCards, getEvents, getPageContent, getPosts, getResourceList, getResources, getShareImages, getWpDirectory } from '../data';
import { asset } from '../lib/asset';
import { groupTags, matchesQuery, matchesTags, type FilterGroupId } from '../lib/directory';
import { directoryEntries } from '../lib/directoryItems';
import { useContent } from '../lib/useContent';

// Resources (Figma desktop 783:25613, mobile 865:6071): photo hero, then the
// directory. The directory is the owner's resource list (content/resource-list.json,
// imported from her Obsidian folder) plus guides (blog posts), community events and
// community programs. The filters are the list's tag hierarchy as Figma's column:
// Search, "Ways of getting around", "Who are you?" and "Type of info". A parent tag
// (Rolling) also finds anything tagged with its children (Biking, Bikeshare, ...).
// Several ticks in a group = any of them. Filters and the page live in the URL:
//   /resources?q=bike&mode=Rolling|bus&who=Students&type=Article&page=2

/** How far ahead community events are listed. */
const EVENT_DAYS = 120;

/** A |-separated list from the URL, keeping only values that exist. */
function listParam(allowed: readonly string[], raw: string | null): string[] {
  return (raw ?? '').split('|').filter((v) => allowed.includes(v));
}

/** Entries per page: two photo-led cards (Figma), then rows. The list has ~100 entries, so more rows than Figma's two. */
const PAGE_SIZE = 8;
/** How many entries on each page get the big photo-led card before the list rows. */
const FEATURED = 2;

export function Resources() {
  const data = useContent(async () => {
    const now = new Date();
    const [builtIn, copy, posts, cards, resources, occurrences, shareImages, wp] = await Promise.all([
      getResourceList(),
      getPageContent(),
      getPosts(),
      getConnectCards(),
      getResources(),
      getEvents({ from: now, to: new Date(now.getTime() + EVENT_DAYS * 86_400_000) }),
      getShareImages(),
      getWpDirectory(),
    ]);
    // Inside WordPress, after the starter import: the tag tree and entries come from WP admin.
    const list = wp ? { ...builtIn, groups: wp.groups, tagAliases: {}, resources: [], guides: [] } : builtIn;
    // One card per event: its next date.
    const seen = new Set<string>();
    const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
    return { list, copy: copy.resources, posts, cards, resources, events, shareImages, wp };
  });
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();

  // /resources?type=HappeninginAustin#directory (Community's "Explore Austin"): jump to the directory.
  useEffect(() => {
    if (data && hash === '#directory') directoryRef.current?.scrollIntoView();
  }, [data, hash]);

  const mode = listParam(data ? groupTags(data.list, 'mode') : [], params.get('mode'));
  const who = listParam(data ? groupTags(data.list, 'who') : [], params.get('who'));
  const type = listParam(data ? groupTags(data.list, 'type') : [], params.get('type'));
  const q = params.get('q') ?? '';

  function setFilter(key: FilterGroupId | 'q' | 'page', value: string | undefined) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (value) p.set(key, value);
        else p.delete(key);
        // A new filter starts over at page 1.
        if (key !== 'page') p.delete('page');
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  function toggle(key: FilterGroupId, value: string) {
    const now = params.get(key)?.split('|').filter(Boolean) ?? [];
    const next = now.includes(value) ? now.filter((v) => v !== value) : [...now, value];
    setFilter(key, next.join('|') || undefined);
  }

  const modeKey = mode.join('|');
  const whoKey = who.join('|');
  const typeKey = type.join('|');
  // Every card: blog posts newest first, then resources and programs A-Z, then events: lib/directoryItems.ts.
  const items = useMemo(() => (data ? directoryEntries(data) : []), [data]);

  const results = useMemo(() => {
    if (!data) return [];
    const f = { mode: modeKey ? modeKey.split('|') : [], who: whoKey ? whoKey.split('|') : [], type: typeKey ? typeKey.split('|') : [] };
    return items.filter((i) => matchesTags(data.list, i.tags, f) && matchesQuery(q, i.title, i.description, ...i.tagLabels));
  }, [data, items, modeKey, whoKey, typeKey, q]);

  if (!data) return <PageLoading />;
  const { copy } = data;
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const onPage = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  // The two large cards are picture-led, so entries with a picture go there first.
  const withPhoto = onPage.filter((e) => !!e.photo).slice(0, FEATURED);
  const shown = [...withPhoto, ...onPage.filter((e) => !withPhoto.includes(e))];

  return (
    <>
      {/* Learn and commute */}
      <section className="relative flex flex-col justify-center overflow-hidden px-article py-12 lg:min-h-[406px] lg:py-16">
        <img
          src={asset('/images/resources/commuter.jpg')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover grayscale"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.75)]" />
        <div className="relative flex flex-col items-start gap-5 lg:gap-4">
          <h1 className="m-0 text-fluid font-bold leading-[1.08] tracking-[-0.03em] text-white [--d:45] [--m:38] lg:font-semibold lg:leading-[1.05] lg:tracking-[-0.01em]">
            {copy.hero.title}
          </h1>
          <p className="m-0 max-w-[640px] text-[16px] leading-[1.5] text-white lg:leading-[24px] lg:tracking-[0.01em]">{copy.hero.intro}</p>
          <PageLink
            to={copy.hero.button.to}
            className="flex min-h-[44px] items-center gap-3 bg-bg px-4 text-[14px] leading-[20px] tracking-[0.01em] text-ink transition-opacity duration-hover hover:opacity-90 lg:min-h-[56px] lg:gap-8 lg:bg-leaf lg:px-5 lg:font-semibold"
          >
            {copy.hero.button.label}
            <Arrow className="size-3" strokeWidth={2.5} />
          </PageLink>
        </div>
      </section>

      {/* Directory */}
      <section ref={directoryRef} id="directory" aria-labelledby="directory-title" className="scroll-mt-[96px] px-article py-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:gap-8">
          <h2
            id="directory-title"
            className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:36] [--m:28] lg:leading-[1.05]"
          >
            {copy.title}
          </h2>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            <DirectoryFilters
              query={q}
              onQuery={(v) => setFilter('q', v || undefined)}
              searchLabel={copy.searchLabel}
              onToggle={(key, value) => toggle(key as FilterGroupId, value)}
              groups={data.list.groups.map((g) => ({
                key: g.id,
                label: g.label,
                options: g.tags.flatMap((t) => [
                  { value: t.tag, label: t.label },
                  ...(t.children ?? []).map((c) => ({ value: c.tag, label: c.label, indent: true })),
                ]),
                selected: { mode, who, type }[g.id],
              }))}
            />

            <div className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8" aria-live="polite">
              {results.length === 0 ? (
                <p className="m-0 border-y border-line py-12 text-[16px] text-ink-muted">
                  {copy.noResults}{' '}
                  <button
                    type="button"
                    onClick={() => setParams({}, { replace: true, preventScrollReset: true })}
                    className="text-link underline underline-offset-4"
                  >
                    {copy.clearFilters}
                  </button>
                </p>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                    {shown.slice(0, FEATURED).map((e) => (
                      <DirectoryEntryCard key={e.id} item={e} featured />
                    ))}
                  </div>
                  {shown.length > FEATURED && (
                    <ul className="m-0 list-none border-b border-line p-0">
                      {shown.slice(FEATURED).map((e) => (
                        <li key={e.id}>
                          <DirectoryEntryCard item={e} />
                        </li>
                      ))}
                    </ul>
                  )}
                  <Pagination
                    label="Resources pages"
                    page={page}
                    pages={pages}
                    onChange={(n) => {
                      setFilter('page', n > 1 ? String(n) : undefined);
                      directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
