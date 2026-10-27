import type { DirectoryFilter } from '../../lib/directory';
import { Chip, Eyebrow } from '../ui';

const SMALL_CHIP = '!min-h-[34px] !px-3 !py-1 !text-small';

export type FilterChange = Partial<{ [K in keyof DirectoryFilter]: DirectoryFilter[K] | null }>;

/** "For Who?" and "Type" chips (values straight from the sheet), the search box, and the result count. */
export function DirectoryFilters({
  filter,
  options,
  onChange,
  onClear,
  count,
  searchLabel,
  searchPlaceholder,
}: {
  filter: DirectoryFilter;
  options: { types: string[]; forWho: string[] };
  onChange: (change: FilterChange) => void;
  onClear: () => void;
  count: number;
  searchLabel: string;
  searchPlaceholder: string;
}) {
  const { type, who, q } = filter;
  const filtered = !!(type || who || q);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="flex min-w-0 flex-col gap-3">
          <div role="group" aria-label="For who?" className="flex flex-wrap gap-2">
            <Chip label="All" selected={!who} onClick={() => onChange({ who: null })} className={SMALL_CHIP} />
            {options.forWho.map((w) => (
              <Chip
                key={w}
                label={w}
                selected={who === w}
                onClick={() => onChange({ who: who === w ? null : w })}
                className={SMALL_CHIP}
              />
            ))}
          </div>
          <div role="group" aria-label="Type" className="flex flex-wrap gap-2">
            {options.types.map((t) => (
              <Chip
                key={t}
                label={t}
                selected={type === t}
                onClick={() => onChange({ type: type === t ? null : t })}
                className={SMALL_CHIP}
              />
            ))}
          </div>
        </div>
        <label className="flex flex-col gap-2 md:shrink-0">
          <Eyebrow>{searchLabel}</Eyebrow>
          <input
            type="search"
            value={q}
            onChange={(e) => onChange({ q: e.target.value })}
            placeholder={searchPlaceholder}
            // 16px on phones so iOS doesn't zoom in on focus.
            className="h-[34px] w-full rounded-sm border border-border-strong bg-bg px-3 text-small text-ink max-md:!text-[16px] md:w-[174px]"
          />
        </label>
      </div>
      <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-small text-ink-muted" aria-live="polite">
        <span>
          Showing {count} {count === 1 ? 'resource' : 'resources'}
          {type && ` for ${type}`}
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
