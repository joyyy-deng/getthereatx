import { cx } from '../../lib/cx';
import { asset } from '../../lib/asset';

/**
 * Get There ATX logotype (public/brand/logotype.svg, trimmed to the wordmark).
 * Size it with a width class; the height follows. `crop` is kept so existing
 * callers still compile; both use the same file now.
 */
export function Logo({ className }: { className?: string; crop?: 'footer' | 'nav' }) {
  return (
    <img
      src={asset('/brand/logotype.svg')}
      alt="Get There ATX"
      width={862}
      height={80}
      className={cx('block h-auto shrink-0', className)}
    />
  );
}
