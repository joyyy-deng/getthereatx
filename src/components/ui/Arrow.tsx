import { cx } from '../../lib/cx';

/**
 * Figma's angled arrow (↗, "Angled arrow" / Frame 979:2010), on every link and
 * button, inside the site or out (Joy, 2026-11-12: ↗ everywhere, as in Figma).
 * Drawn in the text color; size it with a class (default 16px).
 */
export function Arrow({ className = 'size-4', strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" className={cx('block shrink-0', className)}>
      <path d="M3 13L13 3M13 11V3H5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="square" />
    </svg>
  );
}
