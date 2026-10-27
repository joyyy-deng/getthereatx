import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DirectoryFilters, type FilterChange } from '../components/resources/DirectoryFilters';
import { ModeFilterCards } from '../components/resources/ModeFilterCards';
import { PersonaCards } from '../components/resources/PersonaCards';
import { PageLoading, Pagination, ResourceList, SectionHeader, SheetRow } from '../components/ui';
import { getDirectory, getPageContent, getResourcesPage } from '../data';
import { directoryOptions, filterDirectory, type DirectoryFilter } from '../lib/directory';
import { useContent } from '../lib/useContent';
import { useMediaQuery } from '../lib/useMediaQuery';

// Resources (Figma 350:1440). The directory is the client's "Trip Planning"
// Google Sheet (content/sheets/trip-planning.csv), filtered in place by its own
// "Type" and "For Who?" values. Filters live in the URL: /resources?type=Biking&who=Commuters&q=bike

/** Phones page through the directory; wider screens show the whole list. */
const PAGE_SIZE = 6;

function oneOf<T extends string>(list: readonly T[], value: string | null): T | undefined {
  return list.find((v) => v === value);
}

export function Resources() {
  const data = useContent(async () => {
    const [entries, page, copy] = await Promise.all([getDirectory(), getResourcesPage(), getPageContent()]);
    return { entries, options: directoryOptions(entries), ...page, copy: copy.resources };
  });
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLDivElement>(null);
  const paged = useMediaQuery('(max-width: 767px)');
  const [page, setPage] = useState(1);

  const filter: DirectoryFilter = {
    type: oneOf(data?.options.types ?? [], params.get('type')),
    who: oneOf(data?.options.forWho ?? [], params.get('who')),
    q: params.get('q') ?? '',
  };
  const { type, who, q } = filter;

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
  const clearFilters = () => setFilter({ type: null, who: null, q: null });

  function showDirectory() {
    directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const results = useMemo(() => (data ? filterDirectory(data.entries, { type, who, q }) : []), [data, type, who, q]);

  // Any filter change starts the directory over at page 1.
  useEffect(() => setPage(1), [type, who, q]);

  if (!data) return <PageLoading />;
  const { copy } = data;

  const rows = results.map((e) => <SheetRow key={e.id} entry={e} linkLabel={copy.linkLabel} from="resources" />);
  const pages = paged ? Math.max(1, Math.ceil(rows.length / PAGE_SIZE)) : 1;
  const current = Math.min(page, pages);
  const shown = paged ? rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE) : rows;

  return (
    <div className="px-6 md:px-8">
      {/* How-to's: mode cards filter the directory below. */}
      <section className="mx-auto flex max-w-content flex-col gap-12 pt-16 md:pt-24">
        <SectionHeader level={1} size="display" eyebrow={copy.modes.eyebrow} title={copy.modes.title} />
        <ModeFilterCards
          modes={data.modes}
          selected={type}
          onSelect={(t) => {
            setFilter({ type: t });
            if (t) showDirectory();
          }}
        />
      </section>

      <section className="mx-auto flex max-w-content flex-col gap-12 py-16 md:py-24">
        <SectionHeader size="display" eyebrow={copy.personas.eyebrow} title={copy.personas.title} />
        <PersonaCards
          personas={data.personas}
          who={who}
          type={type}
          onFilter={(f) => {
            setFilter(f);
            showDirectory();
          }}
        />

        <div ref={directoryRef} className="flex scroll-mt-[140px] flex-col gap-4">
          <DirectoryFilters
            filter={filter}
            options={data.options}
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
