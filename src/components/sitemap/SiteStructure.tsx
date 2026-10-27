import { areaColor, HOME_COLOR, siteTree, type SiteArea, type SiteMapRow, type SitePage } from '../../lib/sitemap';

/** Jump target for a page in the interaction map below. */
const mapAnchor = (name: string) => `map-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const count = (p: SitePage) => p.sections.reduce((n, s) => n + s.items.length, 0);

function PageBox({ page, color }: { page: SitePage; color: string }) {
  return (
    <div className="flex flex-col">
      <a
        href={`#${mapAnchor(page.name)}`}
        className="group flex flex-col gap-2 border border-border-strong bg-bg p-3 transition-colors duration-hover hover:bg-surface-muted"
        style={{ borderLeft: `4px solid ${color}` }}
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-body font-medium text-ink">{page.name}</span>
          <span className="font-mono text-data text-ink-muted">{page.url}</span>
        </span>
        <ul className="m-0 flex list-none flex-col gap-1 p-0 text-small text-ink-muted">
          {page.sections.map((s) => (
            <li key={s.name} className="flex justify-between gap-2">
              <span>{s.name}</span>
              <span className="font-mono text-data">{s.items.length}</span>
            </li>
          ))}
        </ul>
        <span className="text-label normal-case tracking-normal text-ink-muted">
          {count(page)} buttons and links · see in the map ↓
        </span>
      </a>
      {page.children.length > 0 && (
        <div className="ml-4 flex flex-col gap-3 border-l border-ink pl-4 pt-3">
          {page.children.map((c) => (
            <div key={c.name} className="relative">
              <span aria-hidden="true" className="absolute -left-4 top-6 h-px w-4 bg-ink" />
              <PageBox page={c} color={color} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * The site's structure the way the team thinks about it: Home, then the three
 * concept-model areas (Go, Learn, Connect) with their pages and sections, then
 * what sits outside them. Areas come from content/sheets/site-map-areas.csv.
 */
export function SiteStructure({ rows, areas }: { rows: SiteMapRow[]; areas: SiteArea[] }) {
  const { global, roots } = siteTree(rows);
  const all: SitePage[] = [];
  const walk = (p: SitePage) => {
    all.push(p);
    p.children.forEach(walk);
  };
  roots.forEach(walk);
  const byName = new Map(all.map((p) => [p.name, p]));
  const inArea = new Set(areas.flatMap((a) => a.pages));
  const home = byName.get('Home');
  // An area shows its top pages; pages nested under another page in the same area draw inside it.
  const topPages = (a: SiteArea) =>
    a.pages
      .map((n) => byName.get(n))
      .filter((p): p is SitePage => !!p)
      .filter((p) => !a.pages.some((other) => byName.get(other)?.children.includes(p)));
  const others = all.filter(
    (p) => p.name !== 'Home' && !inArea.has(p.name) && !all.some((q) => q.children.includes(p)),
  );

  return (
    <div className="flex flex-col items-stretch">
      {/* Global nav: on every page. */}
      <div className="flex flex-col gap-2 border border-ink bg-ink p-3 text-white md:flex-row md:items-center md:justify-between">
        <span className="text-body font-medium">Nav and footer · on every page</span>
        <span className="text-small opacity-80">
          {global.sections.map((s) => `${s.name}: ${s.items.map((i) => i.label).join(', ')}`).join('  ·  ')}
        </span>
      </div>
      <span aria-hidden="true" className="mx-auto h-6 w-px bg-ink" />

      {home && (
        <>
          <div className="mx-auto w-full max-w-[420px]">
            <PageBox page={home} color={HOME_COLOR} />
          </div>
          <span aria-hidden="true" className="mx-auto h-6 w-px bg-ink" />
        </>
      )}

      {/* The three areas. */}
      <div className="relative grid gap-6 md:grid-cols-3">
        <span aria-hidden="true" className="absolute left-[16.6%] right-[16.6%] top-0 hidden h-px bg-ink md:block" />
        {areas.map((a) => (
          <section key={a.name} aria-label={a.name} className="flex flex-col">
            <span aria-hidden="true" className="mx-auto hidden h-6 w-px bg-ink md:block" />
            <header className="flex flex-col gap-1 p-3 text-white" style={{ background: areaColor(a.name) }}>
              <span className="text-h4">{a.name}</span>
              <span className="text-small opacity-90">{a.purpose}</span>
            </header>
            <div className="flex flex-col gap-3 border-x border-b border-border-strong bg-surface-muted p-3">
              {topPages(a).map((p) => (
                <PageBox key={p.name} page={p} color={areaColor(a.name)} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {others.length > 0 && (
        <div className="mt-6 flex flex-col gap-3 border-t border-dashed border-ink-muted pt-4">
          <p className="m-0 text-small text-ink-muted">Outside the three areas</p>
          <div className="grid gap-3 md:grid-cols-3">
            {others.map((p) => (
              <PageBox key={p.name} page={p} color="var(--mode-drive)" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
