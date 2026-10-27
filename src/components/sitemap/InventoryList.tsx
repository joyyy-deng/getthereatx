import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { isIssue, pageAnchor, sitePages, type SiteMapRow } from '../../lib/sitemap';
import { Eyebrow } from '../ui';

function Destination({ row, pageNames }: { row: SiteMapRow; pageNames: Set<string> }) {
  const to = row.goesTo;
  if (pageNames.has(to))
    return (
      <a href={`#${pageAnchor(to)}`} className="text-link underline underline-offset-4">
        {to} →
      </a>
    );
  if (/^https?:/.test(to))
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-link underline underline-offset-4"
      >
        {to.replace(/^https?:\/\/(www\.)?/, '')} ↗
      </a>
    );
  return <span className="text-ink-muted">{to}</span>;
}

/** Every row of the site map sheet, by page, with search and an issues-only filter. */
export function InventoryList({ rows }: { rows: SiteMapRow[] }) {
  const [query, setQuery] = useState('');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const pages = sitePages(rows);
  const pageNames = new Set(pages.map((p) => p.name));
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!issuesOnly || isIssue(r)) &&
      (!q || [r.section, r.element, r.label, r.does, r.goesTo, r.notes].some((s) => s.toLowerCase().includes(q))),
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search buttons, links, destinations"
          aria-label="Search the inventory"
          className="h-[34px] w-full rounded-sm border border-border-strong bg-bg px-3 text-small max-md:!text-[16px] md:w-[280px]"
        />
        <label className="flex items-center gap-2 text-small">
          <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
          Only broken or placeholder
        </label>
        <span className="text-small text-ink-muted">
          {shown.length} of {rows.length}
        </span>
      </div>

      {pages.map((p) => {
        const items = shown.filter((r) => r.page === p.name);
        if (!items.length) return null;
        return (
          <article key={p.name} id={pageAnchor(p.name)} className="scroll-mt-[96px] border-t border-border-strong pt-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3">
              <h3 className="m-0 text-h4 font-normal">
                {p.name === 'Every page' ? 'Nav and footer (every page)' : p.name}
              </h3>
              {p.url.startsWith('/') && (
                <Link to={p.url} target="_blank" className="text-small text-link underline underline-offset-4">
                  Open {p.url} ↗
                </Link>
              )}
            </div>
            <div className="hidden grid-cols-[1fr_1.4fr_1.3fr_1.2fr] gap-4 border-b border-border pb-2 md:grid">
              {['Where', 'What you see', 'What it does', 'Goes to'].map((h) => (
                <Eyebrow key={h}>{h}</Eyebrow>
              ))}
            </div>
            <ul className="m-0 list-none p-0">
              {items.map((r, i) => (
                <li
                  key={i}
                  className={cx(
                    'grid gap-1 border-b border-border py-3 text-small md:grid-cols-[1fr_1.4fr_1.3fr_1.2fr] md:gap-4',
                    isIssue(r) && 'bg-alert-disruption-bg',
                  )}
                >
                  <span className="text-ink-muted">{r.section}</span>
                  <span>
                    <span className="text-ink-muted">{r.element}: </span>
                    <span className="text-ink">{r.label}</span>
                  </span>
                  <span className="text-ink-muted">
                    {r.does}
                    {r.notes && (
                      <span className={cx('block', isIssue(r) ? 'text-alert-disruption-ink' : 'text-ink-muted')}>
                        {r.notes}
                      </span>
                    )}
                  </span>
                  <span>
                    <Destination row={r} pageNames={pageNames} />
                    {r.opensIn && r.opensIn !== 'Same tab' && <span className="block text-ink-muted">{r.opensIn}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
      {!shown.length && <p className="m-0 text-body text-ink-muted">Nothing matches that search.</p>}
    </div>
  );
}
