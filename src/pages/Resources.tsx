import { useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { DirectoryEntryCard } from '../components/resources/DirectoryEntryCard';
import { DirectoryFilters } from '../components/resources/DirectoryFilters';
import { PageLoading, Pagination } from '../components/ui';
import { Arrow } from '../components/ui/Arrow';
import { PageLink } from '../components/ui/PageLink';
import { getCategoryNames, getConnectCards, getDirectory, getDirectoryTags, getEvents, getPageContent, getPosts, getResources, getShareImages } from '../data';
import { cardDateText } from '../lib/eventText';
import { asset } from '../lib/asset';
import { filterDirectory, filterGuides } from '../lib/directory';
import { eventItem, guideItem, programItem, sheetItem } from '../lib/directoryItems';
import { useContent } from '../lib/useContent';

// Resources (Figma desktop 783:25613, mobile 865:6071): photo hero, then the
// directory. The directory is the client's "Trip Planning" Google Sheet
// (content/sheets/trip-planning.csv) plus the guides (blog posts), filtered by
// Figma's column: Search, "Ways of getting around" (the sheet's transportation
// types), "Who are you?" (its For who? tags) and "Type of info" (Guides or
// Websites). Several ticks in a group = any of them.
// Filters and the page live in the URL:
//   /resources?q=bike&mode=Biking|Walking&who=Commuter&type=guides&page=2
// (| between values: some sheet labels have commas, e.g. "Carpooling, Van or Car/Rideshare")

const TYPES = ['websites', 'programs', 'events', 'guides'] as const;

/** How far ahead community events are listed. */
const EVENT_DAYS = 120;

/** A |-separated list from the URL, keeping only values that exist. */
function listParam<T extends string>(allowed: readonly T[], raw: string | null): T[] {
  return (raw ?? '').split('|').filter((v): v is T => (allowed as readonly string[]).includes(v));
}

/** Entries per page (Figma: two photo-led cards, then two rows). */
const PAGE_SIZE = 4;
/** How many entries on each page get the big photo-led card before the list rows. */
const FEATURED = 2;

export function Resources() {
  const data = useContent(async () => {
    const now = new Date();
    const [entries, tags, copy, posts, categoryNames, cards, resources, occurrences, shareImages] = await Promise.all([
      getDirectory(),
      getDirectoryTags(),
      getPageContent(),
      getPosts(),
      getCategoryNames(),
      getConnectCards(),
      getResources(),
      getEvents({ from: now, to: new Date(now.getTime() + EVENT_DAYS * 86_400_000) }),
      getShareImages(),
    ]);
    // One card per event: its next date.
    const seen = new Set<string>();
    const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
    return { entries, tags, copy: copy.resources, posts, categoryNames, cards, resources, events, shareImages };
  });
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLElement>(null);
  const { hash } = useLocation();

  // /resources?type=events#directory (Community's "Explore Austin"): jump to the directory.
  useEffect(() => {
    if (data && hash === '#directory') directoryRef.current?.scrollIntoView();
  }, [data, hash]);

  const modeLabels = data?.tags.transportation.options.map((o) => o.label) ?? [];
  const whoLabels = data?.tags.forWho.tags.map((t) => t.label) ?? [];
  const mode = listParam(modeLabels, params.get('mode'));
  const who = listParam(whoLabels, params.get('who'));
  const types = listParam(TYPES, params.get('type'));
  const q = params.get('q') ?? '';

  function setFilter(key: 'who' | 'mode' | 'type' | 'q' | 'page', value: string | undefined) {
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

  function toggle(key: 'who' | 'mode' | 'type', value: string) {
    const now = params.get(key)?.split('|').filter(Boolean) ?? [];
    const next = now.includes(value) ? now.filter((v) => v !== value) : [...now, value];
    setFilter(key, next.join('|') || undefined);
  }

  const modeKey = mode.join('|');
  const whoKey = who.join('|');
  const typeKey = types.join('|');
  const results = useMemo(() => {
    if (!data) return [];
    const { copy } = data;
    const labels = { guide: copy.guidesLabel, readGuide: copy.readGuide, watchVideo: copy.watchVideo };
    const modes = modeKey ? modeKey.split('|') : [];
    const whos = whoKey ? whoKey.split('|') : [];
    const kinds = typeKey ? typeKey.split('|') : [];
    const show = (kind: string) => !kinds.length || kinds.includes(kind);
    const matches = (...fields: string[]) => !q.trim() || fields.some((s) => s.toLowerCase().includes(q.trim().toLowerCase()));
    // Only websites have a transportation type, so a "Ways of getting around" tick shows only websites.
    const noModes = !modes.length;
    const sheet = show('websites') ? filterDirectory(data.entries, { who: whos, mode: modes, q }, data.tags).map((e) => sheetItem(e, copy.linkLabel, e.url ? data.shareImages[e.url] : undefined)) : [];
    const guides = show('guides') && noModes ? filterGuides(data.posts, whos, data.tags, q).map((p) => guideItem(p, labels, data.categoryNames)) : [];
    // Programs: "Who are you?" matches their program's audiences.
    const chosen = data.tags.forWho.tags.filter((t) => whos.includes(t.label));
    const programs =
      show('programs') && noModes
        ? data.cards.flatMap((c) => {
            const r = data.resources.find((x) => x.id === c.resourceId);
            if (!r || !matches(c.title.en, c.body.en, r.oneLiner)) return [];
            if (chosen.length && !chosen.some((t) => r.audiences.some((a) => t.audiences.includes(a)))) return [];
            return [programItem(c, r, copy.programLabel)];
          })
        : [];
    // Events have no audience or transportation type: they show unless one of those filters is on.
    const events =
      show('events') && noModes && !whos.length
        ? data.events
            .filter((o) => matches(o.event.title.en, o.event.blurb.en, o.event.venue.name))
            .map((o) => eventItem(o, { eyebrow: copy.eventLabel, action: copy.eventAction }, cardDateText(o.start)))
        : [];
    return [...sheet, ...programs, ...events, ...guides];
  }, [data, modeKey, whoKey, typeKey, q]);

  if (!data) return <PageLoading />;
  const { copy } = data;
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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
              onToggle={(key, value) => toggle(key as 'who' | 'mode' | 'type', value)}
              groups={[
                { key: 'mode', label: copy.filters.mode, options: modeLabels.map((m) => ({ value: m, label: m })), selected: mode },
                { key: 'who', label: copy.filters.who, options: whoLabels.map((w) => ({ value: w, label: w })), selected: who },
                {
                  key: 'type',
                  label: copy.filters.type,
                  options: [
                    { value: 'websites', label: copy.filters.websites },
                    { value: 'programs', label: copy.filters.programs },
                    { value: 'events', label: copy.filters.events },
                    { value: 'guides', label: copy.filters.guides },
                  ],
                  selected: types,
                },
              ]}
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
