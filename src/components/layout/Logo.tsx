import { cx } from '../../lib/cx';
import { asset } from '../../lib/asset';

/**
 * Get There ATX wordmark ("Walk Bike Ride Share" lockup). The source image has
 * extra canvas around the mark; each crop matches a Figma logo layer.
 *   footer  Footer / mobile nav "Get There ATX logo" (330 × 106, 248 × 80, 210 × 64)
 *   nav     Desktop "Nav" identity sign (278 × 54): a tighter crop of the same image
 * Size it with a width class; the height follows.
 */
const CROPS = {
  footer: { aspect: 'aspect-[330/106]', img: 'left-[-5.7%] top-[-65.68%] h-[368.18%] w-[207.22%]' },
  nav: { aspect: 'aspect-[278/54]', img: 'left-[-6.11%] top-[-160.21%] h-[654.55%] w-[222.13%]' },
};

export function Logo({ className, crop = 'footer' }: { className?: string; crop?: keyof typeof CROPS }) {
  const c = CROPS[crop];
  return (
    <span className={cx('relative block shrink-0 overflow-hidden', c.aspect, className)}>
      <img src={asset('/brand/logo-2027.png')} alt="Get There ATX" className={cx('absolute max-w-none', c.img)} />
    </span>
  );
}
