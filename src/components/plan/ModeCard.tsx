import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { typicalMinutes, type CardPlan } from '../../lib/trip';

/**
 * Figma "Transportation option" (783:25566): mode, time, distance · cost, and
 * the mode's mascot (100px wide). Desktop: #888 outline, 28/13 padding, 22px
 * time, a cost pill (leaf / yellow / red outline); the picked card turns sky
 * with navy text. Phones: the picked card is grey with a dark outline.
 */
export function ModeCard({
  card,
  miles,
  selected,
  onSelect,
}: {
  card: CardPlan;
  miles: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const { mode, minutes, longRide } = card;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cx(
        'flex h-[132px] w-full items-center gap-3 border p-4 text-left transition-colors duration-hover lg:h-[160px] lg:px-[13px] lg:py-7',
        selected ? 'border-charcoal bg-surface-muted lg:border-border-control lg:bg-sky lg:text-navy' : 'border-line bg-bg hover:border-ink-muted lg:border-border-control',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 leading-[1.3]">
        <span className="text-[16px] font-semibold leading-[1.3] tracking-[-0.04em] lg:leading-[24px] lg:tracking-normal">{text(mode.title)}</span>
        <span className="tabular text-time font-medium lg:text-[22px] lg:font-normal lg:leading-[28px]">{typicalMinutes(minutes)} min</span>
        {/* Figma: phones say "5.2 miles · no cost"; desktop says "5.2 miles" with a cost pill under it. */}
        <span className="text-[12px] leading-[1.3] text-ink-soft lg:text-[14px] lg:leading-[20px] lg:tracking-[0.01em] lg:text-ink-muted">
          {longRide ? (
            'Long ride · try bike + bus'
          ) : (
            <>
              {miles.toFixed(1)} miles
              <span className={mode.chip ? 'lg:hidden' : undefined}> · {text(mode.cost)}</span>
            </>
          )}
        </span>
        {mode.chip && !longRide && (
          <span
            className={cx(
              'mt-[14px] hidden self-start rounded-pill border bg-bg px-[6px] py-1 text-[11px] leading-[16px] tracking-[0.01em] lg:inline-block',
              { free: 'border-leaf', fare: 'border-[#fdc601]', drive: 'border-[#e62841]' }[mode.chip.tone],
            )}
          >
            {text(mode.chip.label)}
          </span>
        )}
      </span>
      {mode.image && (
        <img
          src={asset(mode.image.src)}
          alt=""
          className="block h-auto max-h-[107px] w-[100px] shrink-0 object-contain"
        />
      )}
    </button>
  );
}
