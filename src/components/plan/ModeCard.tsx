import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { typicalMinutes, type CardPlan } from '../../lib/trip';

/**
 * Figma "Transportation option" (783:25566): mode, time, distance · cost, and
 * the mode's mascot. Picking a card shows its route detail below.
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
        'flex h-[132px] w-full items-center gap-3 border p-4 text-left transition-colors duration-hover lg:h-[160px]',
        selected ? 'border-charcoal bg-surface-muted' : 'border-line bg-bg hover:border-ink-muted',
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 leading-[1.3]">
        <span className="text-copy font-bold tracking-[-0.02em] text-ink">{text(mode.title)}</span>
        <span className="tabular text-time font-medium text-ink">{typicalMinutes(minutes)} min</span>
        <span className="text-caption text-ink-soft">
          {longRide ? 'Long ride · try bike + bus' : `${miles.toFixed(1)} miles · ${text(mode.cost)}`}
        </span>
      </span>
      {mode.image && (
        <img
          src={asset(mode.image.src)}
          alt=""
          className="block h-auto max-h-[100px] w-[84px] shrink-0 object-contain lg:max-h-[112px] lg:w-[92px]"
        />
      )}
    </button>
  );
}
