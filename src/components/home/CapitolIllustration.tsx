import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';

// Figma home v1 hero picture (1094:3928, 451 × 448): the pale sky (a raster
// layer in Figma, 1px below the top) under the skyline, the sloth on the bus
// and the sun (one SVG). Scales as one picture from phone to desktop.
export function CapitolIllustration({ alt, className }: { alt: string; className?: string }) {
  return (
    <div role="img" aria-label={alt} className={cx('relative aspect-[451/448] overflow-hidden', className)}>
      <img src={asset('/images/home/hero-sky.webp')} alt="" className="absolute inset-x-0 bottom-0 top-[0.24%] block size-full max-w-none object-fill" />
      <img src={asset('/images/home/hero-sloth-bus.svg')} alt="" className="absolute inset-0 block size-full max-w-none" />
    </div>
  );
}
