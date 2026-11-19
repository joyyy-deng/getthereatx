import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Place, Resource } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { asset } from '../../lib/asset';
import { handoffUrl } from '../../lib/trip';
import { Eyebrow, LinkOut } from '../ui';

export interface PlaceComboboxProps {
  label: string;
  placeholder: string;
  places: Place[];
  value?: Place;
  /** The place picked in the other field; it can't be picked here too. */
  other?: Place;
  otherNote: string;
  /** Which Google Maps parameter typed text goes into for the no-match link. */
  side: 'from' | 'to';
  googleMaps?: Resource;
  onChange: (place: Place | undefined) => void;
  /** `white` on the Home trip card; `field` (light grey) on Plan Your Trip. */
  tone?: 'white' | 'field';
  /** Figma's Home trip card has no chevron; the field still opens its list on click. */
  chevron?: boolean;
  /** Plan Your Trip on desktop: a 52px field instead of 62px, so the map gets the room. */
  compact?: boolean;
  /** Plan Your Trip: this is the field map clicks will fill. */
  selected?: boolean;
  /** Called when the field is clicked or focused. */
  onActivate?: () => void;
  /** Home trip card: while empty and not focused, the field rolls through these ("e.g. Mueller"). */
  examples?: string[];
  className?: string;
}

// Popular places first: they're the most common trips.
const GROUPS: { kind: Place['kind']; label: string }[] = [
  { kind: 'destination', label: 'Popular places' },
  { kind: 'neighborhood', label: 'Neighborhoods' },
];

/**
 * Motion Lab "Rolling examples" (Joy 2026-11-19): every few seconds the example rolls up out
 * of the field and the next rolls up in behind it, like a ticker (not a pop in and out).
 * The list ends with the first example again, so it can jump back to the top unseen.
 * Decorative: screen readers get the field's label and placeholder instead.
 */
function ExampleRoller({ items }: { items: string[] }) {
  const [k, setK] = useState(0);
  const [snap, setSnap] = useState(false);
  useEffect(() => {
    if (items.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => setK((n) => n + 1), 2600);
    return () => window.clearInterval(t);
  }, [items.length]);
  // After rolling onto the repeated first example, jump back to the real first one with no motion.
  useEffect(() => {
    if (k < items.length) return;
    const t = window.setTimeout(() => {
      setSnap(true);
      setK(0);
    }, 700);
    return () => window.clearTimeout(t);
  }, [k, items.length]);
  useEffect(() => {
    if (!snap) return;
    const f = requestAnimationFrame(() => requestAnimationFrame(() => setSnap(false)));
    return () => cancelAnimationFrame(f);
  }, [snap]);
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[1.3em] overflow-hidden text-[16px] leading-[1.3] text-ink-muted">
      <span
        className={cx('block', !snap && 'transition-transform duration-[600ms] ease-[var(--ease-lab)]')}
        style={{ transform: `translateY(${-k * 1.3}em)` }}
      >
        {[...items, items[0]].map((s, i) => (
          <span key={i} className="block h-[1.3em] truncate">
            e.g. {s}
          </span>
        ))}
      </span>
    </span>
  );
}

function matches(place: Place, q: string): boolean {
  if (!q) return true;
  return [text(place.name), ...place.aliases].some((s) => s.toLowerCase().includes(q));
}

/**
 * Typeahead over the fixed place list. Clicking the field only selects it; the
 * list opens from the ▾ button, the Down arrow key, or typing. Never dead-ends:
 * no match links out to Google Maps.
 */
export function PlaceCombobox({
  label,
  placeholder,
  places,
  value,
  other,
  otherNote,
  side,
  googleMaps,
  onChange,
  tone = 'field',
  chevron = true,
  compact = false,
  selected = false,
  onActivate,
  examples,
  className = 'w-full',
}: PlaceComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const [query, setQuery] = useState<string | null>(null); // null = not editing
  const [active, setActive] = useState(-1);

  const q = (query ?? '').trim().toLowerCase();
  const results = useMemo(() => places.filter((p) => matches(p, q)), [places, q]);
  // Grouped order is also the keyboard order.
  const ordered = GROUPS.flatMap((g) => results.filter((p) => p.kind === g.kind));
  const isDisabled = (p: Place) => p.id === other?.id;

  function close(commit = true) {
    setOpen(false);
    setActive(-1);
    if (commit && query !== null && query.trim() === '') onChange(undefined);
    setQuery(null);
  }

  function pick(place: Place) {
    if (isDisabled(place)) return;
    onChange(place);
    setQuery(null);
    setOpen(false);
    setActive(-1);
  }

  function move(step: 1 | -1) {
    if (!ordered.length) return;
    let i = active;
    for (let n = 0; n < ordered.length; n++) {
      i = (i + step + ordered.length) % ordered.length;
      if (!isDisabled(ordered[i])) break;
    }
    setActive(i);
    setOpen(true);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      move(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      move(-1);
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      pick(ordered[active]);
    } else if (e.key === 'Escape') {
      close(false);
    }
  }

  const optionId = (p: Place) => `${id}-opt-${p.id}`;
  const shown = query ?? (value ? text(value.name) : '');
  // The examples roll while the field is empty and not being typed in.
  const rolling = !!examples?.length && !focused && !shown;

  return (
    <div className={cx('relative', className)}>
      {/* Figma "Location input": icon, small label, then the place. */}
      <div
        className={cx(
          'relative flex h-[62px] items-start gap-3 border px-[14px] py-[10px]',
          compact && 'lg:h-[52px] lg:py-[6px]',
          tone === 'white' ? 'border-white bg-bg' : 'border-line bg-field lg:border-border-control lg:bg-bg',
          // Hover: the light blue of the Home skyline picture behind the bus (Joy 2026-11-19).
          'transition-colors duration-hover hover:border-[#8eaed6] lg:hover:border-[#8eaed6]',
          // Picked or typing in: no separate highlight ring, just a darker, bolder border (Joy 2026-11-19):
          // navy, 2px (the 1px border plus a 1px inset line, so nothing shifts).
          selected && 'border-navy shadow-[inset_0_0_0_1px_var(--color-navy)] lg:border-navy',
          'focus-within:border-navy focus-within:shadow-[inset_0_0_0_1px_var(--color-navy)] lg:focus-within:border-navy lg:hover:focus-within:border-navy hover:focus-within:border-navy',
        )}
      >
        <img
          src={asset(side === 'from' ? '/icons/circle-dot.svg' : '/icons/map-pin.svg')}
          alt=""
          width={18}
          height={18}
          className="mt-0 block size-[18px] shrink-0"
        />
        <div className={cx('flex min-w-0 flex-1 flex-col gap-[3px] leading-[1.3]', chevron && 'pr-8')}>
          <label
            htmlFor={`${id}-input`}
            className={cx('uppercase', tone === 'white' ? 'text-[12px] leading-[16px] tracking-[0.01em] text-ink-muted lg:text-[14px] lg:font-semibold lg:leading-[20px] lg:text-ink' : 'text-caption font-bold text-ink-soft')}
          >
            {label}
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id={`${id}-input`}
              type="text"
              role="combobox"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
              aria-controls={listId}
              aria-activedescendant={open && active >= 0 ? optionId(ordered[active]) : undefined}
              placeholder={rolling ? '' : placeholder}
              aria-label={rolling ? `${label}, ${placeholder}` : undefined}
              value={shown}
              onClick={() => setOpen(true)}
              onFocus={(e) => {
                setFocused(true);
                onActivate?.();
                e.currentTarget.select();
              }}
              onBlur={() => {
                setFocused(false);
                close();
              }}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(-1);
                setOpen(true);
              }}
              onKeyDown={onKeyDown}
              // 16px so iOS doesn't zoom in on focus; Figma's 15px is close enough.
              className={cx('w-full truncate border-0 bg-transparent p-0 text-[16px] leading-[1.3] text-ink outline-none', tone === 'white' && 'placeholder:text-ink-muted')}
            />
            {rolling && <ExampleRoller items={examples!} />}
          </div>
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label={`Show ${label} places`}
          aria-expanded={open}
          aria-controls={listId}
          // Keep focus in the input so the list doesn't close on blur.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            inputRef.current?.focus();
            setOpen((o) => !o);
          }}
          className={cx('absolute inset-y-0 right-2 w-8 place-items-center text-ink-muted transition-colors duration-hover hover:text-ink', chevron ? 'grid' : 'hidden')}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className={cx('transition-transform duration-hover', open && 'rotate-180')}
          >
            <path
              d="M5 7.5l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {open && (
        <div
          id={listId}
          role="listbox"
          aria-label={`${label} places`}
          // Keep focus in the input while clicking options.
          onMouseDown={(e) => e.preventDefault()}
          className="absolute left-0 top-full z-[1000] mt-1 max-h-[360px] w-full min-w-[280px] max-w-[calc(100vw-48px)] overflow-y-auto border border-line bg-bg py-2 shadow-raised"
        >
          {ordered.length === 0 ? (
            <div className="flex flex-col gap-2 px-4 py-3 text-small">
              <p className="m-0 text-ink">We don't have that place yet.</p>
              {googleMaps && (
                <LinkOut
                  href={handoffUrl(googleMaps, side === 'from' ? { fromText: query ?? '' } : { toText: query ?? '' })}
                  provider={googleMaps.provider}
                  label="Search it in Google Maps"
                  resourceId={googleMaps.id}
                  from="plan"
                />
              )}
            </div>
          ) : (
            GROUPS.map((g) => {
              const items = ordered.filter((p) => p.kind === g.kind);
              if (!items.length) return null;
              return (
                <div key={g.kind} role="group" aria-labelledby={`${id}-${g.kind}`}>
                  <div id={`${id}-${g.kind}`} className="px-4 pb-1 pt-2">
                    <Eyebrow>{g.label}</Eyebrow>
                  </div>
                  {items.map((p) => {
                    const disabled = isDisabled(p);
                    const i = ordered.indexOf(p);
                    return (
                      <div
                        key={p.id}
                        id={optionId(p)}
                        role="option"
                        aria-selected={value?.id === p.id}
                        aria-disabled={disabled || undefined}
                        onClick={() => pick(p)}
                        onMouseEnter={() => !disabled && setActive(i)}
                        className={cx(
                          'flex cursor-pointer items-baseline justify-between gap-3 px-4 py-2 text-body',
                          i === active && 'bg-mist',
                          value?.id === p.id && 'font-medium',
                          disabled && 'cursor-not-allowed text-ink-muted',
                        )}
                      >
                        <span>{text(p.name)}</span>
                        {disabled && <span className="text-small">{otherNote}</span>}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
