import { cx } from '../../lib/cx';
import { track } from '../../lib/track';
import { buttonClasses, type ButtonStyle } from './styles';

// ↗ means "opens another site." Every outbound click is a hand-off and is tracked.

export interface LinkOutProps extends ButtonStyle {
  href: string;
  /** Who runs the destination, e.g. "CapMetro". Announced to screen readers. */
  provider: string;
  label: string;
  /** Registry id, for hand-off metrics. */
  resourceId?: string;
  /** Screen the hand-off came from, e.g. "plan". */
  from?: string;
  mode?: string;
  /**
   * `inline` reads as a text link; `button` uses the Button styles;
   * `row` is the full-width grey row ("Build confidence before you go").
   */
  as?: 'inline' | 'button' | 'row';
  className?: string;
  onHandoff?: () => void;
}

export function LinkOut({
  href,
  provider,
  label,
  resourceId,
  from,
  mode,
  as = 'inline',
  variant = 'primary',
  size,
  shape,
  className,
  onHandoff,
}: LinkOutProps) {
  function handleClick() {
    track('handoff', { resourceId, from, mode, provider, href });
    onHandoff?.();
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}, opens ${provider} in a new tab`}
      onClick={handleClick}
      className={cx(
        {
          button: buttonClasses({ variant, size, shape }),
          inline: 'text-link underline underline-offset-4 decoration-1 hover:decoration-2',
          row: 'flex w-full items-center bg-surface-muted p-4 text-body-lg text-ink transition-colors duration-hover ease-out hover:bg-border',
        }[as],
        className,
      )}
    >
      {label}
      <span aria-hidden="true">&nbsp;↗</span>
    </a>
  );
}
