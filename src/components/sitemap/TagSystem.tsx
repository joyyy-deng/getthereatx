import { Link } from 'react-router-dom';
import type { ResourceList } from '../../content/schema';
import { FILTER_GROUP_IDS, groupTags, matchesTags, type FilterGroupId } from '../../lib/directory';
import { Eyebrow } from '../ui';

const linkTo = (key: FilterGroupId, tag: string) => `/resources?${key}=${encodeURIComponent(tag)}`;

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
        <Eyebrow>Tags it also finds</Eyebrow>
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
              target="_blank" rel="noopener"
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
 * The labeling system: the Resources filters (the owner's tag hierarchy), the tags
 * each also finds, how many resources each finds, and the other label sets on the
 * site. Tags used on notes but missing from the hierarchy are flagged.
 */
export function TagSystem({ list, otherSets }: { list: ResourceList; otherSets: { name: string; where: string; labels: string[] }[] }) {
  const total = list.resources.length;
  const empty = { mode: [], who: [], type: [] } as Record<FilterGroupId, string[]>;
  const inHierarchy = new Set(FILTER_GROUP_IDS.flatMap((id) => groupTags(list, id)));
  const unknown = [...new Set([...list.resources, ...list.guides].flatMap((r) => r.tags).filter((t) => !inHierarchy.has(t)))];
  const noTag = list.resources.filter((r) => !r.tags.some((t) => inHierarchy.has(t) || inHierarchy.has(list.tagAliases[t] ?? '')));

  return (
    <div className="flex flex-col gap-10">
      {list.groups.map((g) => (
        <TagTable
          key={g.id}
          title={`“${g.label}” filter`}
          intro="A checkbox group above the Resources directory. Click a tag to open the directory filtered by it. A parent tag also finds everything tagged with its children."
          total={total}
          rows={g.tags.flatMap((t) => [
            {
              label: t.label,
              covers: (t.children ?? []).map((c) => c.label),
              count: list.resources.filter((r) => matchesTags(list, r.tags, { ...empty, [g.id]: [t.tag] })).length,
              href: linkTo(g.id, t.tag),
            },
            ...(t.children ?? []).map((c) => ({
              label: `${t.label} › ${c.label}`,
              covers: [],
              count: list.resources.filter((r) => matchesTags(list, r.tags, { ...empty, [g.id]: [c.tag] })).length,
              href: linkTo(g.id, c.tag),
            })),
          ])}
        />
      ))}

      {(unknown.length > 0 || noTag.length > 0) && (
        <div className="flex flex-col gap-2 border-l-4 border-alert-disruption-border bg-alert-disruption-bg p-4 text-small text-alert-disruption-ink">
          <p className="m-0 font-medium">Gaps in the tags</p>
          {unknown.length > 0 && <p className="m-0">Tags on notes that are not in the tag hierarchy: {unknown.map((t) => `#${t}`).join(', ')}.</p>}
          {noTag.length > 0 && (
            <p className="m-0">
              {noTag.length} of {total} resources have no filterable tag, so any tick hides them: {noTag.map((e) => e.title).join(', ')}.
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
