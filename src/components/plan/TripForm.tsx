import type { Ref } from 'react';
import type { Place, Resource } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { Eyebrow } from '../ui';
import { PlaceCombobox } from './PlaceCombobox';

export type TripField = 'from' | 'to';

/**
 * Plan Your Trip title and From / To card, on a scrim so it doesn't collide with
 * map labels. On phones it is pinned to the top above the results sheet, and
 * folds into a one-line summary (`collapsed`) while results show.
 */
export function TripForm({
  ref,
  title,
  places,
  from,
  to,
  field,
  onField,
  onChange,
  googleMaps,
  collapsed,
  onCollapse,
}: {
  ref?: Ref<HTMLDivElement>;
  title: string;
  places: Place[];
  from?: Place;
  to?: Place;
  /** The field a map click fills. */
  field: TripField;
  onField: (field: TripField) => void;
  onChange: (next: { from?: Place | null; to?: Place | null }) => void;
  googleMaps?: Resource;
  collapsed: boolean;
  /** Phones with results only: fold (true) or open (false) the card. Omit elsewhere. */
  onCollapse?: (collapsed: boolean) => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[700] px-4 pt-3 md:px-8 lg:z-[500] lg:pt-[74px]">
      <div className="mx-auto max-w-frame">
        <div
          ref={ref}
          className={cx(
            'pointer-events-auto flex flex-col gap-3 bg-white/90 shadow-raised backdrop-blur-sm md:max-w-[440px] lg:-ml-4 lg:w-fit lg:max-w-none lg:gap-4 lg:bg-white/85 lg:p-4 lg:shadow-none',
            collapsed ? 'p-0' : 'p-4',
          )}
        >
          {collapsed && from && to ? (
            <>
              <h1 id="plan-title" className="sr-only">
                {title}
              </h1>
              <button
                type="button"
                aria-expanded={false}
                onClick={() => onCollapse?.(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <Eyebrow>Your trip</Eyebrow>
                  <span className="truncate text-body font-medium text-ink">
                    {text(from.name)} to {text(to.name)}
                  </span>
                </span>
                <span className="text-small text-link underline underline-offset-4">Edit</span>
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3">
                <h1 id="plan-title" className="m-0 text-h4 text-ink lg:text-h1">
                  {title}
                </h1>
                {onCollapse && (
                  <button
                    type="button"
                    onClick={() => onCollapse(true)}
                    className="text-small text-link underline underline-offset-4"
                  >
                    Done
                  </button>
                )}
              </div>
              <div className="flex items-end gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-3 lg:flex-none lg:gap-4">
                  <PlaceCombobox
                    label="From"
                    placeholder={field === 'from' ? 'Click the map' : 'Enter starting point'}
                    places={places}
                    value={from}
                    selected={field === 'from'}
                    onActivate={() => onField('from')}
                    other={to}
                    otherNote="Your destination"
                    side="from"
                    googleMaps={googleMaps}
                    onChange={(p) => {
                      onChange({ from: p ?? null });
                      if (p && !to) onField('to');
                    }}
                    size="sm"
                    className="w-full lg:w-[200px]"
                  />
                  <PlaceCombobox
                    label="To"
                    placeholder={field === 'to' ? 'Click the map' : 'Enter destination'}
                    places={places}
                    value={to}
                    selected={field === 'to'}
                    onActivate={() => onField('to')}
                    other={from}
                    otherNote="Your starting point"
                    side="to"
                    googleMaps={googleMaps}
                    onChange={(p) => onChange({ to: p ?? null })}
                    size="sm"
                    className="w-full lg:w-[200px]"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onChange({ from: to ?? null, to: from ?? null })}
                  disabled={!from && !to}
                  aria-label="Swap From and To"
                  className="mb-[9px] grid size-[32px] place-items-center rounded-pill border border-border-control bg-bg text-body text-ink transition-colors duration-hover hover:bg-surface-muted disabled:opacity-40"
                >
                  <span aria-hidden="true">⇅</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
