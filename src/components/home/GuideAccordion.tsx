import { useId, useState } from 'react';
import type { Img } from '../../content/schema';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { LinkOut } from '../ui';
import { Arrow } from '../ui/Arrow';
import { PageLink } from '../ui/PageLink';

export interface GuideItem {
  id: string;
  title: string;
  body: string;
  image?: Img;
  /** `to`: a guide page on this site. `href`: another site (a registry tool). */
  link: { to: string; label: string } | { href: string; label: string; provider: string; resourceId: string };
}

/**
 * Figma "Confidence guides" (787:6605): one row per way of getting around.
 * One row is open at a time (the first, to start); it shows a photo, a line
 * and a link to the full guide or tool.
 *
 * Motion (Joy's reference recording, 2026-11-17): the open photo folds into its
 * top-right corner while the next one unfolds out of it; rows ease open and shut.
 */
export function GuideAccordion({ items }: { items: GuideItem[] }) {
  const [openId, setOpenId] = useState<string | undefined>(items[0]?.id);
  const baseId = useId();

  return (
    <div className="flex flex-col border-b border-rule">
      {items.map((item) => {
        const open = item.id === openId;
        const panelId = `${baseId}-${item.id}`;
        return (
          <div key={item.id} className="border-t border-rule">
            <h3 className="m-0">
              <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => setOpenId(open ? undefined : item.id)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-fluid font-normal leading-[28px] text-ink [--d:28] [--m:22] lg:py-5 lg:pl-4 lg:font-semibold lg:leading-[1.15] lg:tracking-[-0.01em]"
              >
                {item.title}
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 lg:size-8" fill="none">
                  <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M12 6v12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    className={cx('origin-center transition-transform duration-[450ms] ease-[cubic-bezier(.7,0,.2,1)] [transform-box:fill-box] motion-reduce:transition-none', open && 'rotate-90')}
                  />
                </svg>
              </button>
            </h3>
            {/* Height animates with grid rows (0fr ↔ 1fr). The photo opens out of the top-right corner
                and closes back into it; the words fade up after it. */}
            <div
              id={panelId}
              inert={!open}
              aria-hidden={!open}
              className={cx(
                'grid transition-[grid-template-rows] duration-[600ms] ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none',
                open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  className={cx(
                    'flex flex-col gap-4 bg-sky p-4 transition-[clip-path] duration-[700ms] ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none lg:p-6',
                    open ? '[clip-path:inset(0_0_0_0)]' : '[clip-path:inset(0_0_100%_100%)]',
                  )}
                >
                  {item.image && (
                    <div className="overflow-hidden lg:border lg:border-sky">
                      <img
                        loading="lazy"
                        decoding="async"
                        src={asset(item.image.src)}
                        alt={item.image.alt}
                        className={cx(
                          'block h-[150px] w-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(.7,0,.2,1)] motion-reduce:transition-none lg:h-[180px]',
                          open ? 'scale-100' : 'scale-110',
                        )}
                      />
                    </div>
                  )}
                  <div
                    className={cx(
                      'flex flex-col gap-4 transition-[opacity,transform] duration-[450ms] ease-out motion-reduce:transition-none',
                      open ? 'translate-y-0 opacity-100 delay-[250ms]' : 'translate-y-2 opacity-0',
                    )}
                  >
                    {item.body && (
                      <p className="m-0 text-fluid leading-[24px] text-navy [--d:22] [--m:16] lg:leading-[28px]">
                        {item.body}
                      </p>
                    )}
                    <p className="m-0 text-fluid leading-[16px] tracking-[0.01em] [--d:14] [--m:12] lg:leading-[20px]">
                      {'to' in item.link ? (
                        <PageLink to={item.link.to} className="text-link underline decoration-1 underline-offset-4 hover:decoration-2">
                          {item.link.label}
                          <Arrow className="ml-1 inline-block size-3 align-baseline" />
                        </PageLink>
                      ) : (
                        <LinkOut
                          href={item.link.href}
                          provider={item.link.provider}
                          label={item.link.label}
                          resourceId={item.link.resourceId}
                          from="home"
                        />
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
