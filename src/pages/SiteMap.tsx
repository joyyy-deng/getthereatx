import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SiteMapDiagram } from '../components/sitemap/SiteMapDiagram';
import { SiteMapTree } from '../components/sitemap/SiteMapTree';
import { Eyebrow, SectionHeader } from '../components/ui';
import siteMapCsv from '../content/sheets/site-map.csv?raw';
import tasksCsv from '../content/sheets/site-map-tasks.csv?raw';
import { cx } from '../lib/cx';
import { isIssue, pageAnchor, readSiteMap, readSiteMapTasks, sitePages, type SiteMapRow } from '../lib/sitemap';

// Site map (/dev/sitemap): every page, every button and link, and where each one
// goes, drawn from content/sheets/site-map.csv. For client reviews and for
// testing the information architecture. Edit the sheet, not this file.

const rows = readSiteMap(siteMapCsv);
const tasks = readSiteMapTasks(tasksCsv);
const pages = sitePages(rows);
const pageNames = new Set(pages.map((p) => p.name));

const csvHref = (csv: string) => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

function Destination({ row }: { row: SiteMapRow }) {
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

export function SiteMap() {
  const [query, setQuery] = useState('');
  const [issuesOnly, setIssuesOnly] = useState(false);
  const q = query.trim().toLowerCase();
  const shown = rows.filter(
    (r) =>
      (!issuesOnly || isIssue(r)) &&
      (!q || [r.section, r.element, r.label, r.does, r.goesTo, r.notes].some((s) => s.toLowerCase().includes(q))),
  );
  const outside = rows.filter((r) => r.opensIn === 'New tab').length;
  const issues = rows.filter(isIssue).length;

  return (
    <div className="px-6 pb-16 md:px-8 md:pb-24">
      <div className="mx-auto flex max-w-frame flex-col gap-12 pt-12 md:pt-16">
        <header className="flex flex-col gap-4">
          <SectionHeader level={1} eyebrow="For the team and client" title="Site map" />
          <p className="m-0 max-w-[720px] text-body text-ink-muted">
            Every page, every button and link, and where each one takes you. It comes from the site map sheet, so to
            change it: download the CSV, import it into Google Sheets, edit, then export it back to{' '}
            <code className="font-mono text-data">src/content/sheets/site-map.csv</code>.
          </p>
          <p className="m-0 flex flex-wrap gap-x-6 gap-y-2 text-small">
            <a href={csvHref(siteMapCsv)} download="site-map.csv" className="text-link underline underline-offset-4">
              Download site map (CSV)
            </a>
            <a
              href={csvHref(tasksCsv)}
              download="site-map-tasks.csv"
              className="text-link underline underline-offset-4"
            >
              Download test tasks (CSV)
            </a>
          </p>
          <dl className="m-0 grid grid-cols-2 gap-px border border-border-strong bg-border-strong md:grid-cols-4">
            {[
              ['Pages', pages.filter((p) => p.name !== 'Every page').length],
              ['Buttons and links', rows.length],
              ['Open another site', outside],
              ['Broken or placeholder', issues],
            ].map(([k, v]) => (
              <div key={k} className="flex flex-col gap-1 bg-bg p-4">
                <dt className="text-small text-ink-muted">{k}</dt>
                <dd className="m-0 text-data-lg text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </header>

        <section className="flex flex-col gap-4" aria-labelledby="map-title">
          <h2 id="map-title" className="m-0 text-h3 font-normal">
            The map
          </h2>
          <p className="m-0 max-w-[720px] text-small text-ink-muted">
            Each column is a page: its sections, then every button and link in them. Pages you reach from inside a page
            sit underneath it. Hover a colored “→ page” tag to highlight where it goes, or click it to jump there.
            Scroll sideways to see every page.
          </p>
          <SiteMapTree rows={rows} />
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="diagram-title">
          <h2 id="diagram-title" className="m-0 text-h3 font-normal">
            How the pages connect
          </h2>
          <p className="m-0 text-small text-ink-muted">
            The same map, zoomed out. Numbers count the buttons and links from one page to another.
          </p>
          <SiteMapDiagram rows={rows} />
        </section>

        <section className="flex flex-col gap-6" aria-labelledby="items-title">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 id="items-title" className="m-0 text-h3 font-normal">
              Every button and link
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-small">
                <input type="checkbox" checked={issuesOnly} onChange={(e) => setIssuesOnly(e.target.checked)} />
                Only broken or placeholder
              </label>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the site map"
                className="h-[34px] w-full rounded-sm border border-border-strong bg-bg px-3 text-small max-md:!text-[16px] md:w-[220px]"
              />
            </div>
          </div>

          {pages.map((p) => {
            const items = shown.filter((r) => r.page === p.name);
            if (!items.length) return null;
            const internal = p.url.startsWith('/');
            return (
              <article
                key={p.name}
                id={pageAnchor(p.name)}
                className="scroll-mt-[96px] border-t border-border-strong pt-6"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4">
                  <h3 className="m-0 text-h4 font-normal">
                    {p.name === 'Every page' ? 'Nav and footer (every page)' : p.name}
                  </h3>
                  {internal && (
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
                        <Destination row={r} />
                        {r.opensIn && r.opensIn !== 'Same tab' && (
                          <span className="block text-ink-muted">{r.opensIn}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          {!shown.length && <p className="m-0 text-body text-ink-muted">Nothing matches that search.</p>}
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="tasks-title">
          <h2 id="tasks-title" className="m-0 text-h3 font-normal">
            Test tasks
          </h2>
          <p className="m-0 max-w-[720px] text-small text-ink-muted">
            Ask a tester to do each task without help, starting on the start page. Note the path they take and compare
            it with the expected one. Edit these in site-map-tasks.csv.
          </p>
          <ol className="m-0 flex list-none flex-col p-0">
            {tasks.map((t, i) => (
              <li key={i} className="flex flex-col gap-2 border-t border-border-strong py-4">
                <p className="m-0 text-body text-ink">
                  {i + 1}. {t.task}
                </p>
                <p className="m-0 text-small text-ink-muted">
                  For: {t.who} · Start: {t.start} · Done when: {t.doneWhen}
                </p>
                <p className="m-0 flex flex-wrap items-center gap-1 text-small">
                  <Eyebrow>Expected path</Eyebrow>
                  {t.path.map((step, j) => (
                    <span key={j} className="flex items-center gap-1">
                      {j > 0 && <span aria-hidden="true">›</span>}
                      <span className="border border-border px-2 py-0.5">{step}</span>
                    </span>
                  ))}
                </p>
                {t.notes && <p className="m-0 text-small text-ink-muted">{t.notes}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
