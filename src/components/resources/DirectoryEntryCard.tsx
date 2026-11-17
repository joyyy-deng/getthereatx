import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import type { DirectoryItem } from '../../lib/directoryItems';
import { track } from '../../lib/track';
import { Arrow } from '../ui/Arrow';
import { PageLink } from '../ui/PageLink';

// One card in the Resources directory (a list resource, guide, event or program, see
// lib/directoryItems.ts), in the Figma "Community card" (featured) /
// "Community directory entry" (row) layouts from 787:5267.

/** The saved picture of the site (or the guide's/event's photo), else a plain sky panel. Never a mascot. */
function Art({ photo, className }: { photo?: string; className: string }) {
  if (photo) {
    return <img src={asset(photo)} alt="" loading="lazy" decoding="async" className={cx('block shrink-0 bg-sky object-cover', className)} />;
  }
  return <span aria-hidden="true" className={cx('block shrink-0 bg-sky', className)} />;
}

const eyebrow = 'text-[12px] uppercase leading-[15px] tracking-[1.4px] text-charcoal';
// The action link stretches over its whole card (after:inset-0), so a click anywhere on the card follows it.
const actionClass =
  "inline-flex items-center gap-2 self-start text-[14px] font-semibold leading-[20px] tracking-[0.01em] text-charcoal outline-none after:absolute after:inset-0 after:content-[''] group-hover:underline focus-visible:underline";
/** The whole card lights up on hover or keyboard focus (Joy, 2026-11-17). */
const cardHover = 'group relative cursor-pointer transition-colors duration-hover hover:bg-mist has-[:focus-visible]:bg-mist has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus';

/** "Visit website" hands off to another site; "Read the guide" stays here. Both use Figma's ↗. */
function Action({ item }: { item: DirectoryItem }) {
  const a = item.action;
  if (!a) return null;
  if (a.kind === 'in') {
    return (
      <PageLink to={a.to} className={actionClass}>
        {a.label}
        <Arrow className="size-3" />
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
      <Arrow className="size-3" />
    </a>
  );
}

const titleClass =
  'm-0 text-fluid font-medium leading-[1.06] tracking-[-0.8px] text-ink [--d:22] [--m:24] [overflow-wrap:anywhere] lg:font-normal lg:leading-[28px] lg:tracking-normal';
const descClass = 'm-0 text-fluid leading-[1.5] text-ink-soft [--d:16] [--m:14] lg:tracking-[0.01em]';

/** `featured` is the big photo-led card; otherwise a row with a small image. The description is left out when there is none. */
export function DirectoryEntryCard({ item, featured }: { item: DirectoryItem; featured?: boolean }) {
  if (featured) {
    return (
      <article className={cx('-m-3 flex h-[calc(100%+1.5rem)] min-w-0 flex-col gap-3 p-3', cardHover)}>
        <Art photo={item.photo} className="h-[200px] w-full lg:h-[220px]" />
        {item.eyebrow && <p className={cx('m-0', eyebrow)}>{item.eyebrow}</p>}
        <h3 className={titleClass}>{item.title}</h3>
        {item.description && <p className={descClass}>{item.description}</p>}
        <div className="mt-auto flex flex-col gap-3 pt-1">
          {item.meta && <p className="m-0 text-[11px] leading-[16px] tracking-[0.01em] text-ink">{item.meta}</p>}
          <Action item={item} />
        </div>
      </article>
    );
  }
  return (
    <article className={cx('-mx-3 flex items-start gap-4 border-t border-line px-3 py-5 sm:gap-5', cardHover)}>
      <Art photo={item.photo} className="h-[96px] w-[104px] sm:h-[116px] sm:w-[120px]" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-[6px] self-stretch">
        {item.eyebrow && <p className={cx('m-0', eyebrow)}>{item.eyebrow}</p>}
        <h3 className={titleClass}>{item.title}</h3>
        {item.description && <p className={descClass}>{item.description}</p>}
        {item.meta && <p className="m-0 text-[11px] leading-[16px] tracking-[0.01em] text-ink">{item.meta}</p>}
        <Action item={item} />
      </div>
    </article>
  );
}
