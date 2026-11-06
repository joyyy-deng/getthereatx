import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DirectoryEntryCard } from '../components/resources/DirectoryEntryCard';
import { PageLoading, Pagination } from '../components/ui';
import { FilterSelect } from '../components/ui/FilterSelect';
import { PageLink } from '../components/ui/PageLink';
import { getDirectory, getDirectoryTags, getPageContent } from '../data';
import { asset } from '../lib/asset';
import { cx } from '../lib/cx';
import { filterDirectory } from '../lib/directory';
import { useContent } from '../lib/useContent';

// Resources (Figma desktop 783:25613, mobile 865:6071): photo hero, then the
// directory. The directory is the client's "Trip Planning" Google Sheet
// (content/sheets/trip-planning.csv); the Figma activity list becomes the
// sheet's Transportation types, and the area menu becomes "For who?".
// Filters and the page live in the URL: /resources?mode=Biking&who=Commuter&page=2

function oneOf<T extends string>(list: readonly T[], value: string | null): T | undefined {
  return list.find((v) => v === value);
}

/** Entries per page (Figma: two photo-led cards, then two rows). */
const PAGE_SIZE = 4;
/** How many entries on each page get the big photo-led card before the list rows. */
const FEATURED = 2;

export function Resources() {
  const data = useContent(async () => {
    const [entries, tags, copy] = await Promise.all([getDirectory(), getDirectoryTags(), getPageContent()]);
    return { entries, tags, copy: copy.resources };
  });
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLElement>(null);

  const modes = data?.tags.transportation.options.map((o) => o.label) ?? [];
  const who = oneOf(data?.tags.forWho.tags.map((t) => t.label) ?? [], params.get('who'));
  const mode = oneOf(modes, params.get('mode'));

  function setFilter(key: 'who' | 'mode' | 'page', value: string | undefined) {
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

  const results = useMemo(
    () => (data ? filterDirectory(data.entries, { who, mode, q: '' }, data.tags) : []),
    [data, who, mode],
  );

  if (!data) return <PageLoading />;
  const { copy } = data;
  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Number(params.get('page')) || 1));
  const shown = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const options = [{ label: copy.allLabel, value: undefined }, ...modes.map((m) => ({ label: m, value: m }))];

  return (
    <>
      {/* Learn and commute */}
      <section className="relative overflow-hidden px-page py-12 lg:py-20">
        <img
          src={asset('/images/resources/commuter.jpg')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover grayscale"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.75)]" />
        <div className="relative flex flex-col items-start gap-5 lg:gap-4">
          <h1 className="m-0 text-headline font-bold text-white">
            {copy.hero.title}
          </h1>
          <p className="m-0 max-w-[640px] text-copy text-white">{copy.hero.intro}</p>
          <PageLink
            to={copy.hero.button.to}
            className="flex min-h-[56px] items-center gap-2 bg-bg px-4 text-fine font-medium text-ink transition-opacity duration-hover hover:opacity-90 lg:min-h-[44px]"
          >
            {copy.hero.button.label}
            <span aria-hidden="true" className="text-lead font-normal">
              →
            </span>
          </PageLink>
        </div>
      </section>

      {/* Directory */}
      <section ref={directoryRef} id="directory" aria-labelledby="directory-title" className="scroll-mt-[96px] px-page py-10 lg:py-14">
        <div className="flex flex-col gap-6 lg:gap-8">
          <h2
            id="directory-title"
            className="m-0 text-title font-semibold text-ink"
          >
            {copy.title}
          </h2>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            {/* Filters: chips on phones, a side list on desktop. */}
            <div className="flex flex-col gap-6 lg:w-[240px] lg:shrink-0">
              <ul
                aria-label={data.tags.transportation.label}
                className="m-0 flex list-none flex-wrap gap-2 p-0 lg:flex-col lg:flex-nowrap lg:gap-1"
              >
                {options.map((o) => {
                  const active = o.value === mode;
                  return (
                    <li key={o.label}>
                      <button
                        type="button"
                        aria-pressed={active}
                        onClick={() => setFilter('mode', o.value)}
                        className={cx(
                          'flex h-11 items-center gap-4 px-[14px] text-left text-fine transition-colors duration-hover lg:h-12 lg:w-full lg:justify-between lg:px-4',
                          active ? 'bg-charcoal text-white' : 'bg-mist text-ink hover:bg-sky lg:bg-transparent lg:hover:bg-mist',
                        )}
                      >
                        {o.label}
                        {!active && (
                          <span aria-hidden="true" className="hidden text-charcoal lg:inline">
                            →
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <FilterSelect
                label={data.tags.forWho.label}
                value={who ?? ''}
                onChange={(v) => setFilter('who', v || undefined)}
                options={[
                  { value: '', label: copy.everyoneLabel },
                  ...data.tags.forWho.tags.map((t) => ({ value: t.label, label: t.label })),
                ]}
                className="lg:h-14"
              />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-6 lg:gap-8" aria-live="polite">
              {results.length === 0 ? (
                <p className="m-0 border-y border-line py-12 text-copy text-ink-muted">
                  {copy.noResults}{' '}
                  <button
                    type="button"
                    onClick={() => setParams({}, { replace: true, preventScrollReset: true })}
                    className="text-link underline underline-offset-4"
                  >
                    Clear filters
                  </button>
                </p>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:gap-8">
                    {shown.slice(0, FEATURED).map((e) => (
                      <DirectoryEntryCard key={e.id} entry={e} linkLabel={copy.linkLabel} featured />
                    ))}
                  </div>
                  {shown.length > FEATURED && (
                    <ul className="m-0 list-none border-b border-line p-0">
                      {shown.slice(FEATURED).map((e) => (
                        <li key={e.id}>
                          <DirectoryEntryCard entry={e} linkLabel={copy.linkLabel} />
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
