import { cx } from '../../lib/cx';
import { asset } from '../../lib/asset';

/**
 * Get There ATX wordmark ("Walk Bike Ride Share" lockup). The source image has
 * extra canvas around the mark; the crop matches the Figma logo layer. Size it
 * with a width class: the height follows (Figma 298 × 96).
 */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx('relative block aspect-[298/96] shrink-0 overflow-hidden', className)}>
      <img
        src={asset('/brand/logo-2027.png')}
        alt="Get There ATX"
        className="absolute left-[-5.7%] top-[-65.68%] h-[368.18%] w-[207.22%] max-w-none"
      />
    </span>
  );
}
