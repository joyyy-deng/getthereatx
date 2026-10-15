import type { ButtonHTMLAttributes } from 'react';
import { cx } from '../../lib/cx';
import { pillClasses } from './styles';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> {
  selected?: boolean;
  label: string;
}

/** Toggleable filter. Selected chips are ink-filled. */
export function Chip({ selected = false, label, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={selected} className={cx(pillClasses(selected), className)} {...rest}>
      {label}
    </button>
  );
}
