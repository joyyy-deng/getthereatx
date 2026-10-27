import { Link } from 'react-router-dom';
import type { DirectoryTags } from '../../content/schema';
import type { DirectoryEntry } from '../../content/sheet';
import { filterDirectory } from '../../lib/directory';
import { Eyebrow } from '../ui';

const linkTo = (key: 'who' | 'mode', label: string) => `/resources?${key}=${encodeURIComponent(label)}`;

function TagTable({
  title,
  intro,
  rows,
  total,
}: {
  title: string;
  intro: string;
  rows: { label: string; covers: string[]; count: number; href: string }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-h4 font-normal">{title}</h3>
        <p className="m-0 text-small text-ink-muted">{intro}</p>
      </div>
      <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] gap-4 border-b border-border pb-2 md:grid">
        <Eyebrow>Site label</Eyebrow>
        <Eyebrow>Client sheet words it covers</Eyebrow>
        <Eyebrow>Resources it finds (of {total})</Eyebrow>
      </div>
      <ul className="m-0 list-none p-0">
        {rows.map((r) => (
          <li
            key={r.label}
            className="grid gap-2 border-b border-border py-3 text-small md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)] md:items-center md:gap-4"
          >
            <Link
              to={r.href}
              target="_blank"
              className="w-fit rounded-pill border border-border-strong px-3 py-1 text-ink hover:bg-surface-muted"
            >
              {r.label}
            </Link>
            <span className="flex flex-wrap gap-1">
              {r.covers.map((c) => (
                <span key={c} className="bg-surface-muted px-2 py-0.5 font-mono text-data text-ink-muted">
                  {c}
                </span>
              ))}
            </span>
            <span className="flex items-center gap-3">
              <span className="h-2 flex-1 bg-surface-muted">
                <span className="block h-full bg-ink" style={{ width: `${(r.count / max) * 100}%` }} />
              </span>
              <span className="w-6 text-right font-mono text-data">{r.count}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The labeling system: the Resources tags and Transportation options, which of
 * the client's sheet words each covers, how many resources each finds, and the
 * other label sets on the site. Sheet words nothing covers are flagged.
 */
export function TagSystem({
  entries,
  tags,
  otherSets,
}: {
  entries: DirectoryEntry[];
  tags: DirectoryTags;
  otherSets: { name: string; where: string; labels: string[] }[];
}) {
  const total = entries.length;
  const sheetWho = [...new Set(entries.flatMap((e) => e.forWho))];
  const sheetTypes = [...new Set(entries.flatMap((e) => e.types))];
  const coveredWho = new Set(tags.forWho.tags.flatMap((t) => t.sheetForWho));
  const coveredTypes = new Set([...tags.forWho.tags, ...tags.transportation.options].flatMap((x) => x.sheetType));
  const uncovered = [
    ...sheetWho.filter((v) => !coveredWho.has(v)).map((v) => `“${v}” (For Who?)`),
    ...sheetTypes.filter((v) => !coveredTypes.has(v)).map((v) => `“${v}” (Type)`),
  ];
  const noTag = entries.filter(
    (e) => !tags.forWho.tags.some((t) => filterDirectory([e], { who: t.label, q: '' }, tags).length),
  );

  return (
    <div className="flex flex-col gap-10">
      <TagTable
        title={`“${tags.forWho.label}” tags`}
        intro="Chips above the Resources directory. Click a tag to open the directory filtered by it."
        total={total}
        rows={tags.forWho.tags.map((t) => ({
          label: t.label,
          covers: [...t.sheetForWho, ...t.sheetType.map((v) => `${v} (Type)`)],
          count: filterDirectory(entries, { who: t.label, q: '' }, tags).length,
          href: linkTo('who', t.label),
        }))}
      />
      <TagTable
        title={`“${tags.transportation.label}” dropdown`}
        intro="Mode options next to the search box. The Bus / Bike / Carpool / Walk cards also set it."
        total={total}
        rows={tags.transportation.options.map((o) => ({
          label: o.label,
          covers: o.sheetType,
          count: filterDirectory(entries, { mode: o.label, q: '' }, tags).length,
          href: linkTo('mode', o.label),
        }))}
      />

      {(uncovered.length > 0 || noTag.length > 0) && (
        <div className="flex flex-col gap-2 border-l-4 border-alert-disruption-border bg-alert-disruption-bg p-4 text-small text-alert-disruption-ink">
          <p className="m-0 font-medium">Gaps in the tags</p>
          {uncovered.length > 0 && (
            <p className="m-0">Client sheet words no tag or option covers: {uncovered.join(', ')}.</p>
          )}
          {noTag.length > 0 && (
            <p className="m-0">
              {noTag.length} of {total} resources match no “{tags.forWho.label}” tag, so picking any tag hides them:{' '}
              {noTag.map((e) => e.name).join(', ')}.
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h3 className="m-0 text-h4 font-normal">Other label sets</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {otherSets.map((s) => (
            <div key={s.name} className="flex flex-col gap-2 border border-border-strong p-3">
              <span className="text-body font-medium">{s.name}</span>
              <span className="text-label normal-case tracking-normal text-ink-muted">{s.where}</span>
              <span className="flex flex-wrap gap-1">
                {s.labels.map((l) => (
                  <span key={l} className="rounded-pill border border-border-strong px-2 py-0.5 text-small">
                    {l}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
