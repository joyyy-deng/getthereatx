import type { DirectoryTags } from '../../content/schema';
import type { DirectoryFilter } from '../../lib/directory';
import { Chip, Eyebrow } from '../ui';

const SMALL_CHIP = '!min-h-[34px] !px-3 !py-1 !text-small';
// 16px on phones so iOS doesn't zoom in on focus.
const FIELD =
  'h-[34px] w-full rounded-sm border border-border-strong bg-bg px-3 text-small text-ink max-md:!text-[16px] md:w-[200px]';

export type FilterChange = Partial<{ [K in keyof DirectoryFilter]: DirectoryFilter[K] | null }>;

/** "For who?" tag chips, the Transportation dropdown, the search box, and the result count. */
export function DirectoryFilters({
  filter,
  tags,
  onChange,
  onClear,
  count,
  searchLabel,
  searchPlaceholder,
}: {
  filter: DirectoryFilter;
  tags: DirectoryTags;
  onChange: (change: FilterChange) => void;
  onClear: () => void;
  count: number;
  searchLabel: string;
  searchPlaceholder: string;
}) {
  const { who, mode, q } = filter;
  const filtered = !!(who || mode || q);

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div role="group" aria-label={tags.forWho.label} className="flex flex-wrap gap-2">
          <Chip label="All" selected={!who} onClick={() => onChange({ who: null })} className={SMALL_CHIP} />
          {tags.forWho.tags.map((t) => (
            <Chip
              key={t.label}
              label={t.label}
              selected={who === t.label}
              onClick={() => onChange({ who: who === t.label ? null : t.label })}
              className={SMALL_CHIP}
            />
          ))}
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:items-end lg:shrink-0">
          <label className="flex flex-col gap-2">
            <Eyebrow>{tags.transportation.label}</Eyebrow>
            <select value={mode ?? ''} onChange={(e) => onChange({ mode: e.target.value || null })} className={FIELD}>
              <option value="">All</option>
              {tags.transportation.options.map((o) => (
                <option key={o.label} value={o.label}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2">
            <Eyebrow>{searchLabel}</Eyebrow>
            <input
              type="search"
              value={q}
              onChange={(e) => onChange({ q: e.target.value })}
              placeholder={searchPlaceholder}
              className={FIELD}
            />
          </label>
        </div>
      </div>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-small text-ink-muted" aria-live="polite">
        <span>
          Showing {count} {count === 1 ? 'resource' : 'resources'}
          {mode && ` for ${mode}`}
          {who && ` · ${who}`}
        </span>
        {filtered && (
          <button type="button" onClick={onClear} className="text-link underline underline-offset-4">
            Clear filters
          </button>
        )}
      </p>
    </>
  );
}
