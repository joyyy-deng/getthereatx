import { Link } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { buttonClasses, type ButtonStyle } from './styles';

// → means "stays on GetThereATX." Internal navigation only.

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
    <Link to={to} className={cx(styles, className)}>
      {label}
      <span aria-hidden="true">&nbsp;→</span>
    </Link>
  );
}
