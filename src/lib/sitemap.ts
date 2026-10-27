import { parseCsv } from '../content/sheet';

// The site map lives in two sheets the team and client can edit in Google
// Sheets (content/sheets/site-map.csv and site-map-tasks.csv). These helpers
// read them; /dev/sitemap draws them.

export interface SiteMapRow {
  page: string;
  url: string;
  section: string;
  element: string;
  label: string;
  does: string;
  goesTo: string;
  opensIn: string;
  source: string;
  onClientSheet: string;
  notes: string;
  testStatus: string;
}

export interface SiteMapTask {
  task: string;
  who: string;
  start: string;
  path: string[];
  doneWhen: string;
  notes: string;
  result: string;
}

/** Rows as objects keyed by the header row, so column order can change in the sheet. */
function records(csv: string): Record<string, string>[] {
  const [header = [], ...rows] = parseCsv(csv);
  const keys = header.map((h) => h.trim());
  return rows.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? '').trim()])));
}

export function readSiteMap(csv: string): SiteMapRow[] {
  return records(csv).map((r) => ({
    page: r['Page'],
    url: r['Page URL'],
    section: r['Section'],
    element: r['Element'],
    label: r['Label'],
    does: r['What it does'],
    goesTo: r['Goes to'],
    opensIn: r['Opens in'],
    source: r['Content comes from'],
    onClientSheet: r['On client sheet?'],
    notes: r['Notes'],
    testStatus: r['Test status'],
  }));
}

export function readSiteMapTasks(csv: string): SiteMapTask[] {
  return records(csv).map((r) => ({
    task: r['Task'],
    who: r["Who it's for"],
    start: r['Start page'],
    path: r['Expected path']
      .split('>')
      .map((s) => s.trim())
      .filter(Boolean),
    doneWhen: r['Done when'],
    notes: r['Notes'],
    result: r['Result'],
  }));
}

/** The pages in the map ("Every page" is the nav and footer), with their URLs, in sheet order. */
export function sitePages(rows: SiteMapRow[]): { name: string; url: string }[] {
  const seen = new Map<string, string>();
  for (const r of rows) if (!seen.has(r.page)) seen.set(r.page, r.url);
  return [...seen].map(([name, url]) => ({ name, url }));
}

/** In-page anchor for a page's section on /dev/sitemap. */
export const pageAnchor = (name: string) => `page-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

export const isIssue = (r: SiteMapRow) => /broken|placeholder/i.test(r.notes) || /fail|broken/i.test(r.testStatus);

/** Links between pages, counted, for the diagram. Outside links are grouped. */
export function pageLinks(rows: SiteMapRow[]) {
  const names = new Set(rows.map((r) => r.page));
  const counts = new Map<string, number>();
  for (const r of rows) {
    const to = names.has(r.goesTo)
      ? r.goesTo
      : /^https?:|^Google Maps|Link column/.test(r.goesTo)
        ? 'Outside sites'
        : r.goesTo.startsWith('mailto:')
          ? 'Email'
          : undefined;
    if (!to || to === r.page) continue;
    const key = `${r.page}→${to}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([key, count]) => {
    const [from, to] = key.split('→');
    return { from, to, count };
  });
}

export type LinkKind = 'page' | 'outside' | 'email' | 'action';

/** What clicking an item does: go to another page, open another site, start an email, or act on this page. */
export function linkKind(row: SiteMapRow, pageNames: Set<string>): LinkKind {
  if (pageNames.has(row.goesTo) && row.goesTo !== row.page) return 'page';
  if (row.goesTo.startsWith('mailto:')) return 'email';
  if (row.opensIn === 'New tab') return 'outside';
  return 'action';
}

export interface SiteSection {
  name: string;
  items: SiteMapRow[];
}

export interface SitePage {
  name: string;
  url: string;
  sections: SiteSection[];
  /** Pages first reached from this one (not from the nav), drawn underneath it. */
  children: SitePage[];
}

/**
 * The site as a tree: nav and footer on top, a column per page the nav links to,
 * and pages reached from inside a page placed under that page. Pages nothing
 * links to (like Page not found) get their own column at the end.
 */
export function siteTree(rows: SiteMapRow[]): { global: SitePage; roots: SitePage[] } {
  const nodes = new Map<string, SitePage>();
  for (const r of rows) {
    let node = nodes.get(r.page);
    if (!node) nodes.set(r.page, (node = { name: r.page, url: r.url, sections: [], children: [] }));
    let section = node.sections.find((s) => s.name === r.section);
    if (!section) node.sections.push((section = { name: r.section, items: [] }));
    section.items.push(r);
  }
  const GLOBAL = 'Every page';
  const global = nodes.get(GLOBAL) ?? { name: GLOBAL, url: '*', sections: [], children: [] };
  const names = new Set(nodes.keys());

  const placed = new Set<string>([GLOBAL]);
  const roots: SitePage[] = [];
  for (const r of global.sections.flatMap((s) => s.items))
    if (names.has(r.goesTo) && !placed.has(r.goesTo)) {
      placed.add(r.goesTo);
      roots.push(nodes.get(r.goesTo)!);
    }
  // Breadth-first, so each page sits under the closest page that links to it.
  const queue = [...roots];
  while (queue.length) {
    const parent = queue.shift()!;
    for (const r of parent.sections.flatMap((s) => s.items))
      if (names.has(r.goesTo) && !placed.has(r.goesTo)) {
        placed.add(r.goesTo);
        const child = nodes.get(r.goesTo)!;
        parent.children.push(child);
        queue.push(child);
      }
  }
  for (const [name, node] of nodes) if (!placed.has(name)) roots.push(node);
  return { global, roots };
}
