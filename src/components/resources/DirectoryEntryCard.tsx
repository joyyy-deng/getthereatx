import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import type { DirectoryItem } from '../../lib/directoryItems';
import { track } from '../../lib/track';
import { PageLink } from '../ui/PageLink';

// One card in the Resources directory (a sheet row or a guide, see
// lib/directoryItems.ts), in the Figma "Community card" (featured) /
// "Community directory entry" (row) layouts from 787:5267.

function Art({ art, className }: { art: DirectoryItem['art']; className: string }) {
  if ('photo' in art) {
    return <img src={asset(art.photo)} alt="" className={cx('block shrink-0 object-cover', className)} />;
  }
  return (
    <span aria-hidden="true" className={cx('grid shrink-0 place-items-center bg-sky', className)}>
      {art.mascot && <img src={asset(art.mascot)} alt="" className="block h-1/2 w-auto max-w-[60%]" />}
    </span>
  );
}

const eyebrow = 'text-caption uppercase tracking-[1.4px] text-charcoal';
const actionClass = 'inline-flex items-center gap-3 self-start text-fine font-semibold text-charcoal hover:underline';

/** "Visit website ↗" hands off to another site; "Read the guide →" stays here. */
function Action({ item }: { item: DirectoryItem }) {
  const a = item.action;
  if (!a) return null;
  if (a.kind === 'in') {
    return (
      <PageLink to={a.to} className={actionClass}>
        {a.label}
        <span aria-hidden="true" className="text-lead font-normal">
          →
        </span>
      </PageLink>
    );
  }
  return (
    <a
      href={a.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${a.label}: ${item.title}, opens in a new tab`}
      onClick={() => track('handoff', { resourceId: a.trackId, from: 'resources', href: a.href })}
      className={actionClass}
    >
      {a.label}
      <span aria-hidden="true" className="text-lead font-normal">
        ↗
      </span>
    </a>
  );
}

/** `featured` is the big photo-led card; otherwise a row with a small image. */
export function DirectoryEntryCard({ item, featured }: { item: DirectoryItem; featured?: boolean }) {
  if (featured) {
    return (
      <article className="flex flex-col gap-3">
        <Art art={item.art} className="h-[200px] w-full lg:h-[220px]" />
        {item.eyebrow && <p className={cx('m-0', eyebrow)}>{item.eyebrow}</p>}
        <h3 className="m-0 text-card font-medium text-ink">{item.title}</h3>
        <p className="m-0 text-copy text-ink-soft">{item.description}</p>
        <Action item={item} />
      </article>
    );
  }
  return (
    <article className="flex items-start gap-5 border-t border-line py-5">
      <Art art={item.art} className="h-[116px] w-[120px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        {item.eyebrow && <p className={cx('m-0', eyebrow)}>{item.eyebrow}</p>}
        <h3 className="m-0 text-heading font-medium text-ink">{item.title}</h3>
        <p className="m-0 text-fine text-ink-soft">{item.description}</p>
        {item.meta && <p className="m-0 text-caption text-ink">{item.meta}</p>}
        <Action item={item} />
      </div>
    </article>
  );
}
