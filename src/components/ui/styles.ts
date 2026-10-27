import { cx } from '../../lib/cx';

// Class builders shared by several components (kept out of component files for fast refresh).

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
/** `lg` is the full-width mode-card hand-off (Figma Plan Your Trip). */
export type ButtonSize = 'lg' | 'md' | 'sm';
/** `rounded` for buttons; `pill` for the outlined row buttons in Student resources. */
export type ButtonShape = 'rounded' | 'pill';

export interface ButtonStyle {
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-action text-white hover:bg-action-hover active:bg-action-hover active:translate-y-px',
  secondary: 'border border-border-strong bg-bg text-ink hover:bg-surface-muted active:bg-border',
  ghost: 'text-link underline-offset-4 hover:underline active:opacity-80',
};

const SIZES: Record<ButtonSize, string> = {
  lg: 'min-h-[56px] px-4 text-body-lg font-medium',
  md: 'min-h-[48px] px-6 text-body font-medium',
  sm: 'min-h-[43px] px-4 text-small',
};

/** Shared by Button and button-style LinkOut / LinkIn so every action looks the same. */
export function buttonClasses({ variant = 'primary', size = 'md', shape = 'rounded' }: ButtonStyle = {}): string {
  return cx(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap transition-colors duration-hover ease-out',
    'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0',
    variant !== 'ghost' && SIZES[size],
    variant === 'ghost' && (size === 'sm' ? 'text-small' : 'text-body'),
    shape === 'pill' ? 'rounded-pill' : 'rounded-sm',
    shape === 'pill' && variant === 'secondary' && 'border-border-control',
    VARIANTS[variant],
  );
}

/**
 * Put on a card's one link to make the whole card clickable (the card needs
 * `relative`). The link stays the real target for keyboard and screen readers.
 */
export const STRETCHED_LINK = "after:absolute after:inset-0 after:content-['']";

/** Pill shape and colors shared by Chip and Tabs (Figma Student resources tabs). */
export function pillClasses(selected: boolean): string {
  return cx(
    // Compact on phones (Figma mobile), full size from 768px.
    'inline-flex min-h-[36px] items-center justify-center whitespace-nowrap rounded-pill border border-border-strong px-3 py-[6px] text-small md:min-h-[46px] md:px-[18px] md:py-[10px] md:text-body',
    'transition-colors duration-hover ease-out',
    selected ? 'bg-ink text-white' : 'bg-bg text-ink hover:bg-surface-muted',
  );
}
