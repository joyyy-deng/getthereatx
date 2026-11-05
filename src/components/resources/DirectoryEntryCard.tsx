import type { DirectoryEntry } from '../../content/sheet';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { track } from '../../lib/track';

// The sheet has no photos, so the Figma image slot shows the mascot for the
// entry's first matching type (or stays plain sky).
const MASCOTS: [type: string, src: string][] = [
  ['Public Transit', '/images/mascots/mode-bus.svg'],
  ['Biking', '/images/mascots/mode-bike.svg'],
  ['Walking', '/images/mascots/mode-walk.svg'],
  ['Carpooling, Van or Car/Rideshare', '/images/mascots/mode-bus-walk.svg'],
];

function Art({ entry, className }: { entry: DirectoryEntry; className: string }) {
  const src = MASCOTS.find(([type]) => entry.types.includes(type))?.[1];
  return (
    <span aria-hidden="true" className={cx('grid shrink-0 place-items-center bg-sky', className)}>
      {src && <img src={asset(src)} alt="" className="block h-1/2 w-auto max-w-[60%]" />}
    </span>
  );
}

const eyebrow = 'text-[12px] uppercase leading-[15px] tracking-[1.4px] text-charcoal';

/** "Visit website ↗": hands off to the entry's own site. */
function Action({ entry, label }: { entry: DirectoryEntry; label: string }) {
  if (!entry.url) return null;
  const url = entry.url;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label}: ${entry.name}, opens in a new tab`}
      onClick={() => track('handoff', { resourceId: `sheet:${entry.id}`, from: 'resources', href: url })}
      className="inline-flex items-center gap-3 self-start text-[14px] font-semibold text-charcoal hover:underline"
    >
      {label}
      <span aria-hidden="true" className="text-[18px] font-normal">
        ↗
      </span>
    </a>
  );
}

/**
 * Figma "Community card" / "Community directory entry" (787:5267), filled
 * with a row from the client's Trip Planning sheet. `featured` is the big
 * photo-led card; otherwise a row with a small image.
 */
export function DirectoryEntryCard({
  entry,
  linkLabel,
  featured,
}: {
  entry: DirectoryEntry;
  linkLabel: string;
  featured?: boolean;
}) {
  const types = entry.types.join(' · ');
  if (featured) {
    return (
      <article className="flex flex-col gap-3">
        <Art entry={entry} className="h-[250px] w-full" />
        {types && <p className={cx('m-0', eyebrow)}>{types}</p>}
        <h3 className="m-0 text-[30px] font-medium leading-[1.06] tracking-[-0.8px] text-ink">{entry.name}</h3>
        <p className="m-0 text-[16px] leading-[1.5] text-ink-soft">{entry.description}</p>
        <Action entry={entry} label={linkLabel} />
      </article>
    );
  }
  return (
    <article className="flex items-start gap-5 border-t border-line py-5">
      <Art entry={entry} className="h-[116px] w-[120px]" />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        {types && <p className={cx('m-0', eyebrow)}>{types}</p>}
        <h3 className="m-0 text-[24px] font-medium leading-[1.06] tracking-[-0.8px] text-ink">{entry.name}</h3>
        <p className="m-0 text-[14px] leading-[1.5] text-ink-soft">{entry.description}</p>
        {entry.forWho.length > 0 && (
          <p className="m-0 text-[12px] leading-[1.5] text-ink">{entry.forWho.join(' · ')}</p>
        )}
        <Action entry={entry} label={linkLabel} />
      </div>
    </article>
  );
}
