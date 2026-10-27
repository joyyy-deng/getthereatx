import type { ResourceModeCard } from '../../content/schema';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';

/** Bus / Bike / Carpool / Walk cards: each one sets the directory's Transportation filter. */
export function ModeFilterCards({
  modes,
  selected,
  onSelect,
}: {
  modes: ResourceModeCard[];
  /** The selected Transportation option. */
  selected?: string;
  onSelect: (mode: string | null) => void;
}) {
  return (
    // Below 1024px the cards are small and swipe sideways (Figma mobile).
    <div className="swipe-row !gap-2 md:-mx-8 md:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:!gap-4 lg:overflow-visible lg:px-0 lg:pb-0 [&>*]:w-[150px] lg:[&>*]:w-auto">
      {modes.map((m) => {
        const on = m.transportation === selected;
        return (
          <button
            key={m.mode}
            type="button"
            aria-pressed={on}
            onClick={() => onSelect(on ? null : m.transportation)}
            className={cx(
              'group flex flex-col items-start justify-between gap-2 rounded-none border bg-bg p-3 text-left transition-colors duration-hover lg:min-h-[389px] lg:gap-4 lg:p-[20px]',
              on ? 'border-2 border-ink' : 'border-border-strong hover:bg-surface-muted',
            )}
          >
            <span className="text-small text-ink lg:text-nav">{text(m.title)}</span>
            {m.image ? (
              <img src={asset(m.image.src)} alt={m.image.alt} className="h-[96px] w-full object-contain lg:h-[234px]" />
            ) : (
              <span aria-hidden="true" className="h-[96px] w-full lg:h-[234px]" />
            )}
            <span className="text-small text-link underline underline-offset-4">
              {on ? 'Showing below ↓' : 'Learn more →'}
            </span>
          </button>
        );
      })}
    </div>
  );
}
