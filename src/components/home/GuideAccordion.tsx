import { useId, useState } from 'react';
import type { Img } from '../../content/schema';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { LinkOut } from '../ui';
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
                className="flex w-full items-center justify-between gap-4 py-4 text-left text-heading font-medium text-ink lg:py-5 lg:pl-4"
              >
                {item.title}
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6 shrink-0 lg:size-8" fill="none">
                  <path d="M6 12h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  {!open && <path d="M12 6v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
                </svg>
              </button>
            </h3>
            <div id={panelId} hidden={!open} className={cx('flex-col gap-4 bg-sky p-4 lg:p-6', open && 'flex')}>
              {item.image && (
                <img
                  src={asset(item.image.src)}
                  alt={item.image.alt}
                  className="block h-[150px] w-full object-cover lg:h-[180px] lg:border lg:border-link"
                />
              )}
              <p className="m-0 text-lead text-navy">
                {item.body}
              </p>
              <p className="m-0 text-fine">
                {'to' in item.link ? (
                  <PageLink to={item.link.to} className="text-link underline decoration-1 underline-offset-4 hover:decoration-2">
                    {item.link.label}
                    <span aria-hidden="true">&nbsp;→</span>
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
        );
      })}
    </div>
  );
}
