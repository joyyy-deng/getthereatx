import { Fragment } from 'react';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { PageLink } from './PageLink';

/**
 * Big colored link card with a mascot: Figma "See all guides" (Home),
 * "Explore More" (Home) and "Explore Austin" (Community).
 * `stacked`: the mascot sits under the title on desktop (See all guides).
 * `side`: the mascot sits to the right and runs off the card's edge.
 */
export function MascotCard({
  title,
  to,
  tone,
  mascot,
  layout,
  className,
}: {
  title: string[];
  to: string;
  tone: 'leaf' | 'sky';
  /** Decorative: the title says where the card goes. */
  mascot: { src: string; flip?: boolean };
  layout: 'stacked' | 'side';
  className?: string;
}) {
  // Navy, not white, on the leaf green: white is 2.7:1 there (fails WCAG AA), navy 4.8:1.
  const ink = 'text-navy';
  const art = (
    <img
      src={asset(mascot.src)}
      alt=""
      className={cx('block max-w-none', mascot.flip && '-scale-x-100')}
    />
  );

  return (
    <PageLink
      to={to}
      className={cx(
        'group relative flex overflow-hidden p-6 lg:border lg:border-sky lg:p-9',
        tone === 'leaf' ? 'bg-leaf' : 'bg-sky-strong',
        layout === 'stacked' ? 'h-[250px] lg:h-[420px]' : 'h-[260px] lg:h-auto lg:min-h-[303px]',
        className,
      )}
    >
      <span className={cx('relative z-10 flex h-full flex-col justify-between', ink)}>
        <span
          className={cx(
            'block text-feature',
            tone === 'leaf' ? 'font-semibold' : 'font-bold',
          )}
        >
          {title.map((line, i) => (
            <Fragment key={i}>
              {i > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </span>
        <span
          aria-hidden="true"
          className={cx(
            'text-[40px] leading-none transition-transform duration-hover group-hover:translate-x-1',
            layout === 'stacked' && 'lg:hidden',
          )}
        >
          →
        </span>
      </span>

      {layout === 'stacked' ? (
        <>
          {/* Phones: beside the title. Desktop: under it, arrow bottom right. */}
          <span className="absolute left-[155px] top-9 h-[199px] w-[170px] lg:left-9 lg:top-auto lg:bottom-9 lg:h-[276px] lg:w-[236px] [&_img]:size-full">
            {art}
          </span>
          <span
            aria-hidden="true"
            className={cx(
              'absolute bottom-9 right-9 hidden text-[40px] leading-none transition-transform duration-hover group-hover:translate-x-1 lg:block',
              ink,
            )}
          >
            →
          </span>
        </>
      ) : (
        <span className="absolute left-[185px] top-[62px] h-[190px] w-[235px] lg:bottom-9 lg:left-auto lg:right-[-96px] lg:top-auto lg:h-[246px] lg:w-[304px] [&_img]:size-full">
          {art}
        </span>
      )}
    </PageLink>
  );
}
