import { cx } from '../../lib/cx';
import { Arrow } from './Arrow';
import { PageLink } from './PageLink';
import { buttonClasses, type ButtonStyle } from './styles';

// A link to another GetThereATX page, with Figma's angled arrow (↗ on every link, Joy 2026-11-12).

export interface LinkInProps extends ButtonStyle {
  to: string;
  label: string;
  /**
   * `inline`: text link. `row`: full-width grey row ("Build confidence before you go").
   * `button`: Button styles.
   */
  as?: 'inline' | 'row' | 'button';
  className?: string;
}

export function LinkIn({ to, label, as = 'inline', variant = 'primary', size, shape, className }: LinkInProps) {
  const styles = {
    inline: 'text-link underline underline-offset-4 decoration-1 hover:decoration-2',
    row: 'flex w-full items-center bg-surface-muted p-4 text-body-lg text-ink transition-colors duration-hover ease-out hover:bg-border',
    button: buttonClasses({ variant, size, shape }),
  }[as];

  return (
    <PageLink to={to} className={cx(styles, className)}>
      {label}
      <Arrow className="ml-[6px] inline-block size-3 align-baseline" />
    </PageLink>
  );
}
