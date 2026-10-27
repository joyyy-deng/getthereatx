import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DirectoryFilters, type FilterChange } from '../components/resources/DirectoryFilters';
import { ModeFilterCards } from '../components/resources/ModeFilterCards';
import { PersonaCards } from '../components/resources/PersonaCards';
import { PageLoading, Pagination, ResourceList, SectionHeader, SheetRow } from '../components/ui';
import { getDirectory, getDirectoryTags, getPageContent, getResourcesPage } from '../data';
import { filterDirectory, type DirectoryFilter } from '../lib/directory';
import { useContent } from '../lib/useContent';
import { useMediaQuery } from '../lib/useMediaQuery';
import { abVersion } from '../lib/abTests';
import { cx } from '../lib/cx';

// Resources (Figma 350:1440). The directory is the client's "Trip Planning"
// Google Sheet (content/sheets/trip-planning.csv), filtered by our own tags and a
// Transportation dropdown (content/directory-tags.json maps them to the sheet's
// words). Filters live in the URL: /resources?who=Commuter&mode=Biking&q=bike

// A/B test Learn [1] (/learn=b): no mode cards or "Which sounds most like you?" cards;
// the directory comes right after the title.

/** Phones page through the directory; wider screens show the whole list. */
const PAGE_SIZE = 6;

function oneOf<T extends string>(list: readonly T[], value: string | null): T | undefined {
  return list.find((v) => v === value);
}

export function Resources() {
  const data = useContent(async () => {
    const [entries, tags, page, copy] = await Promise.all([
      getDirectory(),
      getDirectoryTags(),
      getResourcesPage(),
      getPageContent(),
    ]);
    return { entries, tags, ...page, copy: copy.resources };
  });
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLDivElement>(null);
  const paged = useMediaQuery('(max-width: 767px)');
  const [page, setPage] = useState(1);

  const filter: DirectoryFilter = {
    who: oneOf(data?.tags.forWho.tags.map((t) => t.label) ?? [], params.get('who')),
    mode: oneOf(data?.tags.transportation.options.map((o) => o.label) ?? [], params.get('mode')),
    q: params.get('q') ?? '',
  };
  const { who, mode, q } = filter;

  function setFilter(change: FilterChange) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(change)) {
          if (value) p.set(key, value);
          else p.delete(key);
        }
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }
  const clearFilters = () => setFilter({ who: null, mode: null, q: null });

  function showDirectory() {
    directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const results = useMemo(
    () => (data ? filterDirectory(data.entries, { who, mode, q }, data.tags) : []),
    [data, who, mode, q],
  );

  // Any filter change starts the directory over at page 1.
  useEffect(() => setPage(1), [who, mode, q]);

  if (!data) return <PageLoading />;
  const { copy } = data;

  const rows = results.map((e) => <SheetRow key={e.id} entry={e} linkLabel={copy.linkLabel} from="resources" />);
  const pages = paged ? Math.max(1, Math.ceil(rows.length / PAGE_SIZE)) : 1;
  const current = Math.min(page, pages);
  const shown = paged ? rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : rows;
  const directoryOnly = abVersion('learn') === 'b';

  return (
    <div className="px-6 md:px-8">
      {/* How-to's: mode cards filter the directory below. */}
      <section className="mx-auto flex max-w-content flex-col gap-12 pt-16 md:pt-24">
        <SectionHeader level={1} size="display" eyebrow={copy.modes.eyebrow} title={copy.modes.title} />
        {!directoryOnly && (
          <ModeFilterCards
            modes={data.modes}
            selected={mode}
            onSelect={(m) => {
              setFilter({ mode: m });
              if (m) showDirectory();
            }}
          />
        )}
      </section>

      <section
        className={cx(
          'mx-auto flex max-w-content flex-col gap-12 pb-16 md:pb-24',
          directoryOnly ? 'pt-12' : 'pt-16 md:pt-24',
        )}
      >
        {!directoryOnly && (
          <>
            <SectionHeader size="display" eyebrow={copy.personas.eyebrow} title={copy.personas.title} />
            <PersonaCards
              personas={data.personas}
              who={who}
              mode={mode}
              onFilter={(f) => {
                setFilter(f);
                showDirectory();
              }}
            />
          </>
        )}

        <div ref={directoryRef} className="flex scroll-mt-[140px] flex-col gap-4">
          <DirectoryFilters
            filter={filter}
            tags={data.tags}
            onChange={setFilter}
            onClear={clearFilters}
            count={rows.length}
            searchLabel={copy.searchLabel}
            searchPlaceholder={copy.searchPlaceholder}
          />
        </div>

        {rows.length > 0 ? (
          <div className="flex flex-col gap-6">
            <ResourceList>{shown}</ResourceList>
            <Pagination
              label="Directory pages"
              page={current}
              pages={pages}
              onChange={(n) => {
                setPage(n);
                showDirectory();
              }}
            />
          </div>
        ) : (
          <p className="m-0 border-y border-border-strong py-12 text-body text-ink-muted">
            {copy.noResults}{' '}
            <button type="button" onClick={clearFilters} className="text-link underline underline-offset-4">
              Clear filters
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
