import { useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import type { Place, Resource } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
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
  /** `light` for fields set on a dark photo (Home hero). */
  tone?: 'dark' | 'light';
  /** `sm` is the compact field on Plan Your Trip. */
  size?: 'md' | 'sm';
  /** Plan Your Trip: this is the field map clicks will fill. */
  selected?: boolean;
  /** Called when the field is clicked or focused. */
  onActivate?: () => void;
  className?: string;
}

// Popular places first: they're the most common trips.
const GROUPS: { kind: Place['kind']; label: string }[] = [
  { kind: 'destination', label: 'Popular places' },
  { kind: 'neighborhood', label: 'Neighborhoods' },
];

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
  tone = 'dark',
  size = 'md',
  selected = false,
  onActivate,
  className = 'w-[260px]',
}: PlaceComboboxProps) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
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

  return (
    <div className={cx('relative flex flex-col gap-2', className)}>
      <label htmlFor={`${id}-input`}>
        <Eyebrow className={cx(tone === 'light' && '!text-white')}>{label}</Eyebrow>
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
          placeholder={placeholder}
          value={shown}
          onFocus={(e) => {
            onActivate?.();
            e.currentTarget.select();
          }}
          onBlur={() => close()}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className={cx(
            'w-full rounded-sm border bg-surface-muted pr-12 text-ink outline-none focus-visible:border-focus',
            selected ? 'border-focus ring-1 ring-focus' : 'border-transparent',
            size === 'sm' ? 'p-3 text-body' : 'p-3 text-body-lg md:p-4',
            // 16px on phones so iOS doesn't zoom in on focus.
            'max-md:!text-[16px]',
          )}
        />
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
          className="absolute inset-y-0 right-3 grid w-8 place-items-center text-ink-muted transition-colors duration-hover hover:text-ink"
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
          className="absolute left-0 top-full z-[1000] mt-2 max-h-[360px] w-[320px] max-w-[calc(100vw-48px)] overflow-y-auto rounded-md border border-border bg-bg py-2 shadow-raised"
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
                          i === active && 'bg-surface-muted',
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
