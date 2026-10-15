import { cx } from '../../lib/cx';
import { asset } from '../../lib/asset';

/** Get There ATX wordmark. Crop matches the Figma "image 1" layer (141 × 43). */
export function Logo({ src, className }: { src: string; className?: string }) {
  return (
    <span className={cx('relative block h-[43px] w-[141px] shrink-0 overflow-hidden', className)}>
      <img
        src={asset(src)}
        alt="Get There ATX"
        className="absolute left-[-6.11%] top-0 h-full w-[106.54%] max-w-none"
      />
    </span>
  );
}
