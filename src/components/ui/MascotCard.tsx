import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { Arrow } from './Arrow';
import { PageLink } from './PageLink';

/**
 * Big colored link card with a mascot: Figma "See all guides" and "Explore
 * more" (Home v1 775:3277 / 775:3323, phone 865:5730 / 1024:3670) and
 * Community's green card (787:5466).
 *   Phones (both layouts): a row, 24px padding: the title with a 24px arrow
 *   under it on the left, a small mascot on the right.
 *   Desktop `stacked` (See all guides, 468px tall): the mascot (236 × 276)
 *   under the title, a 40px arrow bottom right.
 *   Desktop `side` (Explore more): title top left, arrow bottom left, the
 *   mascot (310 × 252) bottom right running off the card's edge.
 */
export function MascotCard({
  title,
  to,
  tone,
  mascot,
  layout,
  className,
  titleSize = [28, 45],
}: {
  title: string[];
  to: string;
  tone: 'leaf' | 'sky';
  /** Decorative: the title says where the card goes. */
  mascot: { src: string; flip?: boolean };
  layout: 'stacked' | 'side';
  className?: string;
  /** Figma title size, phone / desktop px. */
  titleSize?: [number, number];
}) {
  // Navy, not Figma's white, on the leaf green: white is 2.7:1 there (fails WCAG AA), navy 4.8:1.
  const art = <img src={asset(mascot.src)} alt="" className={cx('block size-full max-w-none', mascot.flip && '-scale-x-100')} />;
  const arrow = (cls: string): ReactNode => (
    <span className={cx('block transition-transform duration-hover group-hover:-translate-y-0.5 group-hover:translate-x-0.5', cls)}>
      <Arrow className="size-6 lg:size-10" strokeWidth={2.2} />
    </span>
  );

  return (
    <PageLink
      to={to}
      className={cx(
        'group relative flex justify-between gap-4 overflow-hidden p-6 text-navy lg:p-9',
        tone === 'leaf' ? 'bg-leaf' : 'bg-sky',
        layout === 'stacked' ? 'lg:h-[468px]' : 'lg:min-h-[303px]',
        className,
      )}
    >
      <span className={cx('relative z-10 flex shrink-0 flex-col justify-between gap-4 lg:w-auto', layout === 'side' ? 'min-w-[170px] whitespace-nowrap lg:whitespace-normal' : 'w-[170px]')}>
        <span
          className="block text-fluid font-semibold leading-[1.15] tracking-[-0.01em] lg:leading-[1.05]"
          style={{ '--m': titleSize[0], '--d': titleSize[1] } as CSSProperties}
        >
          {title.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </span>
        {layout === 'stacked' && <span className="hidden h-[276px] w-[236px] lg:block">{art}</span>}
        {arrow(layout === 'stacked' ? 'lg:hidden' : '')}
      </span>
      {layout === 'stacked' ? (
        <>
          <span className="block h-[117px] w-[100px] shrink-0 self-center lg:hidden">{art}</span>
          {arrow('hidden self-end lg:block')}
        </>
      ) : (
        <span className="block h-[97px] w-[120px] shrink-0 self-center lg:absolute lg:bottom-9 lg:right-[-80px] lg:h-[252px] lg:w-[310px]">
          {art}
        </span>
      )}
    </PageLink>
  );
}
