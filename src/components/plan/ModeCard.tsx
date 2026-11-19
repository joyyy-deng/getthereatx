import { useEffect, useRef } from 'react';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { typicalMinutes, type CardPlan } from '../../lib/trip';

/**
 * Figma "Transportation option" (783:25566): mode, time, distance · cost, and
 * the mode's mascot (100px wide). Desktop: #888 outline, 28/13 padding, 22px
 * time, a cost pill (leaf / yellow / red outline); the picked card turns sky
 * with navy text. Phones: the picked card is grey with a dark outline.
 * Motion Lab "Mascot hop": cards you didn't pick sit at 55% (full on hover or
 * focus, so they still read); picking a card makes its mascot hop.
 */
const HOP: Keyframe[] = [
  { transform: 'scale(1.08, .9)' },
  { transform: 'translateY(-12px) rotate(-6deg)', offset: 0.35 },
  { transform: 'translateY(0) scale(1.06, .92)', offset: 0.75 },
  { transform: 'none' },
];

export function ModeCard({
  card,
  miles,
  selected,
  onSelect,
  route,
  utShuttle,
}: {
  card: CardPlan;
  miles: number;
  /** Bus cards: "Route 7" (CapMetro's GTFS feed via bus-routes.json). */
  route?: string;
  /** Bus cards: "UT 670 · UT ID" when a UT shuttle runs direct. */
  utShuttle?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const { mode, minutes, longRide } = card;
  const mascot = useRef<HTMLImageElement>(null);
  const mounted = useRef(false);
  // Hop only when the card becomes the picked one, not on page load.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (selected && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // 850ms (Joy 2026-11-19: slower than the Motion Lab's 520ms).
      mascot.current?.animate(HOP, { duration: 850, easing: 'cubic-bezier(.3, 0, .3, 1)' });
    }
  }, [selected]);
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        'flex h-full min-h-[132px] w-full flex-col justify-center gap-2 border p-4 text-left transition-opacity duration-[320ms] ease-[var(--ease-lab)] motion-reduce:transition-none lg:min-h-[120px] lg:gap-2 lg:px-[13px] lg:py-3',
        selected
          ? 'border-charcoal bg-surface-muted lg:border-border-control lg:bg-sky lg:text-navy'
          : 'border-line bg-bg opacity-[.55] hover:border-ink-muted hover:opacity-100 focus-visible:opacity-100 lg:border-border-control',
      )}
    >
      <span className="flex w-full items-center gap-3">
        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 leading-[1.3]">
          <span className="text-[16px] font-semibold leading-[1.3] tracking-[-0.04em] lg:leading-[24px] lg:tracking-normal">{text(mode.title)}</span>
          <span className="tabular text-time font-medium lg:text-[22px] lg:font-normal lg:leading-[28px]">{typicalMinutes(minutes)} min</span>
          {/* "5.2 miles", with the cost as a pill under it (Joy: pills on phones too); modes without a pill keep "· cost". */}
          <span className="text-[12px] leading-[1.3] text-ink-soft lg:text-[14px] lg:leading-[20px] lg:tracking-[0.01em] lg:text-ink-muted">
            {longRide ? (
              'Long ride · try bike + bus'
            ) : (
              <>
                {miles.toFixed(1)} miles
                {!mode.chip && <span> · {text(mode.cost)}</span>}
              </>
            )}
          </span>
        </span>
        {mode.image && (
          <img
            ref={mascot}
            src={asset(mode.image.src)}
            alt=""
            className="block h-auto max-h-[107px] w-[100px] shrink-0 object-contain lg:max-h-[72px] lg:w-[80px]"
          />
        )}
      </span>
      {/* The cost pill and, on bus cards, the route pills: one row across the whole card, so a narrow
          desktop card doesn't stack them one per line (Plan fits one screen, Joy 2026-11-17). */}
      {(mode.chip || route || utShuttle) && !longRide && (
        <span className="flex flex-wrap gap-1">
          {mode.chip && (
            <span
              className={cx(
                'whitespace-nowrap rounded-pill border bg-bg px-[6px] py-1 text-[11px] leading-[16px] tracking-[0.01em]',
                { free: 'border-leaf', fare: 'border-[#fdc601]', drive: 'border-[#e62841]' }[mode.chip.tone],
              )}
            >
              {text(mode.chip.label)}
            </span>
          )}
          {route && (
            <span className="whitespace-nowrap rounded-pill border border-charcoal bg-bg px-[6px] py-1 text-[11px] font-semibold leading-[16px] tracking-[0.01em] text-ink">
              {route}
            </span>
          )}
          {utShuttle && (
            <span className="whitespace-nowrap rounded-pill border border-[#bf5700] bg-bg px-[6px] py-1 text-[11px] font-semibold leading-[16px] tracking-[0.01em] text-ink">
              {utShuttle}
            </span>
          )}
        </span>
      )}
    </button>
  );
}
