import { useState } from 'react';
import { cx } from '../../lib/cx';
import { isIssue, linkKind, siteTree, type SiteMapRow, type SitePage } from '../../lib/sitemap';

type Detail = 'pages' | 'sections' | 'all';

const DETAILS: { id: Detail; label: string }[] = [
  { id: 'pages', label: 'Pages' },
  { id: 'sections', label: '+ Sections' },
  { id: 'all', label: '+ Every button' },
];

const treeAnchor = (name: string) => `map-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const ICON = { page: '→', outside: '↗', email: '✉', action: '•' } as const;

function shortDestination(row: SiteMapRow): string {
  const to = row.goesTo;
  if (/^https?:/.test(to)) return to.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
  if (to.startsWith('mailto:')) return to.slice(7);
  return row.does;
}

interface Ctx {
  detail: Detail;
  pageNames: Set<string>;
  color: Map<string, string>;
  focus?: string;
  setFocus: (name?: string) => void;
}

function Item({ row, ctx }: { row: SiteMapRow; ctx: Ctx }) {
  const kind = linkKind(row, ctx.pageNames);
  const issue = isIssue(row);
  const target = kind === 'page' ? row.goesTo : undefined;
  return (
    <li
      className={cx('flex flex-col gap-1 px-3 py-2', issue && 'bg-alert-disruption-bg')}
      onMouseEnter={() => target && ctx.setFocus(target)}
      onMouseLeave={() => target && ctx.setFocus(undefined)}
    >
      <span className="flex items-start gap-2">
        <span aria-hidden="true" className="w-3 shrink-0 text-ink-muted">
          {ICON[kind]}
        </span>
        <span className="min-w-0">
          <span className="text-ink-muted">{row.element}: </span>
          <span className="text-ink">{row.label}</span>
        </span>
      </span>
      <span className="pl-5">
        {target ? (
          <a
            href={`#${treeAnchor(target)}`}
            onFocus={() => ctx.setFocus(target)}
            onBlur={() => ctx.setFocus(undefined)}
            className="inline-block px-2 py-0.5 text-label normal-case tracking-normal text-white"
            style={{ background: ctx.color.get(target) }}
          >
            → {target}
          </a>
        ) : (
          <span
            className={cx(
              'block break-words text-label normal-case tracking-normal',
              kind === 'action' ? 'text-ink-muted' : 'text-link',
            )}
          >
            {shortDestination(row)}
          </span>
        )}
        {row.notes && (
          <span
            className={cx(
              'block text-label normal-case tracking-normal',
              issue ? 'text-alert-disruption-ink' : 'text-ink-muted',
            )}
          >
            {row.notes}
          </span>
        )}
      </span>
    </li>
  );
}

function Section({ name, items, ctx }: { name: string; items: SiteMapRow[]; ctx: Ctx }) {
  return (
    <div className="border border-border-strong bg-bg">
      <p className="m-0 flex items-baseline justify-between gap-2 border-b border-border px-3 py-2 text-small font-medium text-ink">
        <span>{name}</span>
        <span className="font-mono text-data text-ink-muted">{items.length}</span>
      </p>
      {ctx.detail === 'all' && (
        <ul className="m-0 list-none divide-y divide-border p-0 text-small">
          {items.map((r, i) => (
            <Item key={i} row={r} ctx={ctx} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PageColumn({ page, ctx }: { page: SitePage; ctx: Ctx }) {
  const color = ctx.color.get(page.name);
  const count = page.sections.reduce((n, s) => n + s.items.length, 0);
  const outbound = [
    ...new Set(
      page.sections
        .flatMap((s) => s.items)
        .filter((r) => linkKind(r, ctx.pageNames) === 'page')
        .map((r) => r.goesTo),
    ),
  ];
  return (
    <div className="flex w-[280px] shrink-0 flex-col">
      {/* Line up to the row above. */}
      <span aria-hidden="true" className="mx-auto h-6 w-px bg-ink" />
      <div
        id={treeAnchor(page.name)}
        className={cx(
          'scroll-mt-[96px] flex flex-col gap-3 transition-shadow duration-hover',
          ctx.focus === page.name && 'outline outline-4 outline-offset-4',
        )}
        style={{ outlineColor: color }}
      >
        <div className="flex flex-col gap-1 p-3 text-white" style={{ background: color }}>
          <span className="text-h4">{page.name}</span>
          <span className="font-mono text-data opacity-80">{page.url}</span>
          <span className="text-label normal-case tracking-normal opacity-80">
            {page.sections.length} sections · {count} buttons and links
          </span>
          {ctx.detail === 'pages' && outbound.length > 0 && (
            <span className="text-label normal-case tracking-normal">Links to: {outbound.join(', ')}</span>
          )}
        </div>
        {ctx.detail !== 'pages' &&
          page.sections.map((s) => <Section key={s.name} name={s.name} items={s.items} ctx={ctx} />)}
      </div>
      {page.children.length > 0 && (
        <div className="flex flex-col">
          <span aria-hidden="true" className="mx-auto h-6 w-px bg-ink" />
          <p className="m-0 self-center border border-ink bg-bg px-2 py-0.5 text-label normal-case tracking-normal text-ink-muted">
            Pages inside {page.name}
          </p>
          <div className="flex gap-6">
            {page.children.map((c) => (
              <PageColumn key={c.name} page={c} ctx={ctx} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * The full site map: nav and footer on top, a column per page under it with its
 * sections and every button, and pages reached from inside a page beneath it.
 * Hover a "→ page" tag to highlight where it goes.
 */
export function SiteMapTree({ rows, colors }: { rows: SiteMapRow[]; colors: Map<string, string> }) {
  const [detail, setDetail] = useState<Detail>('all');
  const [focus, setFocus] = useState<string>();
  const { global, roots } = siteTree(rows);

  const order: SitePage[] = [];
  const walk = (p: SitePage) => {
    order.push(p);
    p.children.forEach(walk);
  };
  roots.forEach(walk);
  // Same colors as the structure view: by Go / Learn / Connect area.
  const color = colors;
  const ctx: Ctx = { detail, pageNames: new Set([global.name, ...order.map((p) => p.name)]), color, focus, setFocus };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="How much detail" className="flex">
          {DETAILS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={detail === d.id}
              onClick={() => setDetail(d.id)}
              className={cx(
                '-ml-px border border-ink px-3 py-2 text-small first:ml-0',
                detail === d.id ? 'bg-ink text-white' : 'bg-bg text-ink hover:bg-surface-muted',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
        <p className="m-0 flex flex-wrap gap-x-4 gap-y-1 text-small text-ink-muted">
          <span>→ goes to another page</span>
          <span>↗ opens another site</span>
          <span>✉ starts an email</span>
          <span>• changes this page</span>
          <span className="bg-alert-disruption-bg px-1 text-alert-disruption-ink">broken or placeholder</span>
        </p>
      </div>

      <div className="overflow-x-auto border border-border-strong bg-surface-muted p-6">
        <div className="flex w-max flex-col items-center">
          {/* Nav and footer: on every page. */}
          <div className="flex w-full max-w-[900px] flex-col gap-3 bg-ink p-3 text-white">
            <span className="text-h4">Nav and footer · on every page</span>
            {detail !== 'pages' && (
              <div className="grid gap-3 md:grid-cols-2">
                {global.sections.map((s) => (
                  <div key={s.name} className="text-ink">
                    <Section name={s.name} items={s.items} ctx={ctx} />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Branch line across the top-level pages. */}
          <span aria-hidden="true" className="h-6 w-px bg-ink" />
          <div className="relative flex items-start gap-6">
            <span aria-hidden="true" className="absolute left-[140px] right-[140px] top-0 h-px bg-ink" />
            {roots.map((p) => (
              <PageColumn key={p.name} page={p} ctx={ctx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
