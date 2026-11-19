import { useId, useState, type CSSProperties } from 'react';
import { cx } from '../../lib/cx';
import { useMediaQuery } from '../../lib/useMediaQuery';

// Figma Resources filters (783:25613 desktop, 865:6071 phone): a Search box,
// then three checkbox groups that open and close: "Ways of getting around"
// (open at first), "Who are you?" and "Type of info". Children of a parent tag
// (Biking under Rolling) are indented under it. A group that is open takes the full width on phones.
//   Desktop: a 240px column. Search 16/24 on mist; group titles 22/28 Regular
//   with a chevron; options 16/24 with a 16px checkbox; rules between groups.
//   Phone: Search full width; each group is an outlined box with an 11/16
//   label (the second and third side by side) that opens its checkboxes below.

export interface FilterGroup {
  key: string;
  label: string;
  /** `indent` = a child tag, shown under its parent. */
  options: { value: string; label: string; indent?: boolean }[];
  selected: string[];
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={cx('filter-chevron size-4 shrink-0 lg:size-5', open && 'rotate-180')}
    >
      <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Group({
  group,
  onToggle,
  startOpen,
  className,
}: {
  group: FilterGroup;
  onToggle: (value: string) => void;
  startOpen: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(startOpen);
  const id = useId();
  const count = group.selected.length;
  return (
    <div className={cx('min-w-0 lg:border-b lg:border-line', open && 'max-lg:col-span-2', className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full items-center justify-between gap-2 border border-line bg-bg px-3 text-left text-[11px] leading-[16px] tracking-[0.01em] text-ink lg:h-auto lg:border-0 lg:px-[10px] lg:py-3 lg:text-[22px] lg:leading-[28px] lg:tracking-normal"
      >
        <span className="min-w-0 max-lg:truncate">
          {group.label}
          {count > 0 && <span className="text-ink-soft"> ({count})</span>}
        </span>
        <Chevron open={open} />
      </button>
      {/* Motion Lab "Group opens" (Joy 2026-11-19): the group slides open, then the options fade
          down one by one (index.css .filter-body). Closed, it's inert: no Tab stops, hidden from screen readers. */}
      <div className="filter-body" data-open={open}>
        <fieldset id={id} inert={!open} className="m-0 min-w-0 border-0 p-0">
          <legend className="sr-only">{group.label}</legend>
          <ul className="m-0 flex list-none flex-col gap-1 px-3 py-2 lg:gap-0 lg:px-[10px] lg:pb-4 lg:pt-0">
            {group.options.map((o, i) => (
              <li key={o.value} className={o.indent ? 'pl-6' : undefined} style={{ '--i': i } as CSSProperties}>
                <label className="flex min-h-[40px] cursor-pointer items-center gap-3 text-[14px] leading-[20px] text-ink lg:min-h-[32px] lg:text-[16px] lg:leading-[24px] lg:tracking-[0.01em]">
                  <input
                    type="checkbox"
                    checked={group.selected.includes(o.value)}
                    onChange={() => onToggle(o.value)}
                    className="size-4 shrink-0 cursor-pointer accent-charcoal"
                  />
                  {o.label}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      </div>
    </div>
  );
}

export function DirectoryFilters({
  query,
  onQuery,
  searchLabel,
  groups,
  onToggle,
}: {
  query: string;
  onQuery: (q: string) => void;
  searchLabel: string;
  groups: FilterGroup[];
  onToggle: (key: string, value: string) => void;
}) {
  const searchId = useId();
  // Figma: the first group starts open on desktop; on phones all start closed.
  const desktop = useMediaQuery('(min-width: 1024px)');
  return (
    <div role="search" className="flex flex-col gap-4 lg:w-[240px] lg:shrink-0 lg:gap-6">
      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          {searchLabel}
        </label>
        <input
          id={searchId}
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={searchLabel}
          // 16px on every screen so iOS doesn't zoom in when the field is focused.
          className="h-12 w-full border border-border-control bg-bg pl-[10px] pr-10 text-[16px] leading-[24px] text-ink placeholder:text-ink-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        />
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink"
        >
          <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="M15.5 15.5L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      {/* Phones: the first group full width, the other two side by side. Desktop: one column. */}
      <div className="grid grid-cols-2 gap-2 lg:flex lg:flex-col lg:gap-0">
        {groups.map((g, i) => (
          <Group
            key={g.key}
            group={g}
            onToggle={(v) => onToggle(g.key, v)}
            startOpen={i === 0 && desktop}
            className={i === 0 ? 'col-span-2' : undefined}
          />
        ))}
      </div>
    </div>
  );
}
