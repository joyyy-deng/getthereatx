import type { ReactNode } from 'react';
import { AbTestCards } from '../components/sitemap/AbTestCards';
import { InventoryList } from '../components/sitemap/InventoryList';
import { IssueList } from '../components/sitemap/IssueList';
import { Journeys } from '../components/sitemap/Journeys';
import { SiteMapTree } from '../components/sitemap/SiteMapTree';
import { SiteStructure } from '../components/sitemap/SiteStructure';
import { TagSystem } from '../components/sitemap/TagSystem';
import { PageLoading } from '../components/ui';
import { readTripPlanningSheet } from '../content/sheet';
import areasCsv from '../content/sheets/site-map-areas.csv?raw';
import tasksCsv from '../content/sheets/site-map-tasks.csv?raw';
import siteMapCsv from '../content/sheets/site-map.csv?raw';
import tripPlanningCsv from '../content/sheets/trip-planning.csv?raw';
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS } from '../content/taxonomies';
import { getDirectory, getDirectoryTags, getPlanConfig, getStudentTabs } from '../data';
import { AB_TESTS } from '../lib/abTests';
import { text } from '../lib/i18n';
import { isIssue, pageColors, readSiteAreas, readSiteMap, readSiteMapTasks, sitePages } from '../lib/sitemap';
import { useContent } from '../lib/useContent';

// Site map (/dev/sitemap): the site's information architecture for the team and
// client. Structure (Go / Learn / Connect), labels and tags, key journeys, A/B
// tests, issues, and every button and link. Everything is drawn from the sheets
// in content/sheets/ and the content files, so edit those, not this page.

const rows = readSiteMap(siteMapCsv);
const tasks = readSiteMapTasks(tasksCsv);
const areas = readSiteAreas(areasCsv);
const colors = pageColors(rows, areas);
const sheetWarnings = readTripPlanningSheet(tripPlanningCsv).warnings;

const SECTIONS = [
  {
    id: 'structure',
    title: 'Structure',
    intro:
      'How the site is organized: the nav, Home, and the Go / Learn / Connect areas with each page and its sections. Click a page to see its buttons in the interaction map.',
  },
  {
    id: 'labels',
    title: 'Labels and tags',
    intro:
      'The words people filter and navigate by. The Resources tags use our labels, mapped onto the words in the client’s Trip Planning sheet.',
  },
  {
    id: 'journeys',
    title: 'Key journeys',
    intro:
      'The paths we expect people to take for each test task. Colored steps are pages; outlined steps are a button or choice on a page.',
  },
  { id: 'ab-tests', title: 'A/B tests', intro: 'Each version has its own link. Version A is the current site.' },
  {
    id: 'issues',
    title: 'Issues to fix',
    intro: 'Broken links and placeholders on the site, and gaps in the client’s sheet.',
  },
  {
    id: 'interaction-map',
    title: 'Interaction map',
    intro:
      'Every page with its sections and every button, and where each one goes. Hover a colored “→ page” tag to highlight its destination.',
  },
  { id: 'inventory', title: 'Full inventory', intro: 'Every row of the site map sheet, searchable.' },
] as const;

const csvHref = (csv: string) => `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

function Section({
  index,
  id,
  title,
  intro,
  children,
}: {
  index: number;
  id: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex scroll-mt-[96px] flex-col gap-6 border-t border-border-strong pt-8"
    >
      <div className="flex flex-col gap-2">
        <span className="font-mono text-data text-ink-muted">{String(index + 1).padStart(2, '0')}</span>
        <h2 id={`${id}-title`} className="m-0 text-h2 font-normal">
          {title}
        </h2>
        <p className="m-0 max-w-[720px] text-body text-ink-muted">{intro}</p>
      </div>
      {children}
    </section>
  );
}

export function SiteMap() {
  const data = useContent(async () => {
    const [entries, tags, tabs, plan] = await Promise.all([
      getDirectory(),
      getDirectoryTags(),
      getStudentTabs(),
      getPlanConfig(),
    ]);
    return { entries, tags, tabs, prefs: plan.preferences };
  });
  if (!data) return <PageLoading />;

  const pages = sitePages(rows).filter((p) => p.name !== 'Every page');
  const stats: [string, number | string][] = [
    ['Pages', pages.length],
    ['Buttons and links', rows.length],
    ['Resources in the directory', data.entries.length],
    ['Tags + Transportation options', `${data.tags.forWho.tags.length} + ${data.tags.transportation.options.length}`],
    ['A/B tests', Object.keys(AB_TESTS).length],
    ['Broken or placeholder', rows.filter(isIssue).length],
  ];
  const content: Record<(typeof SECTIONS)[number]['id'], ReactNode> = {
    structure: <SiteStructure rows={rows} areas={areas} />,
    labels: (
      <TagSystem
        entries={data.entries}
        tags={data.tags}
        otherSets={[
          { name: 'Student tabs', where: 'Student resources', labels: data.tabs.map((t) => text(t.label)) },
          {
            name: 'What matters to you?',
            where: 'Plan Your Trip results',
            labels: data.prefs.map((p) => text(p.label)),
          },
          {
            name: 'Place types',
            where: 'Community · Explore Austin',
            labels: ['All', ...PLACE_CATEGORIES.map((c) => PLACE_CATEGORY_LABELS[c])],
          },
        ]}
      />
    ),
    journeys: <Journeys tasks={tasks} colors={colors} />,
    'ab-tests': <AbTestCards />,
    issues: <IssueList rows={rows} sheetWarnings={sheetWarnings} />,
    'interaction-map': <SiteMapTree rows={rows} colors={colors} />,
    inventory: <InventoryList rows={rows} />,
  };

  return (
    <div className="px-6 pb-16 md:px-8 md:pb-24">
      <div className="mx-auto max-w-frame pt-12 md:pt-16 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-12">
        {/* Contents: sticky on desktop, a row of links on phones. */}
        <nav aria-label="Site map sections" className="lg:sticky lg:top-[96px] lg:self-start">
          <ol className="m-0 flex list-none gap-2 overflow-x-auto p-0 pb-4 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="shrink-0">
                <a
                  href={`#${s.id}`}
                  className="flex gap-2 border border-border-strong px-3 py-1 text-small text-ink hover:bg-surface-muted lg:border-0 lg:px-0 lg:py-1 lg:hover:bg-transparent lg:hover:underline"
                >
                  <span className="font-mono text-data text-ink-muted">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex min-w-0 flex-col gap-12">
          <header className="flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <span className="font-mono text-label text-ink-muted">Information architecture · GetThereATX</span>
              <h1 className="m-0 text-h1 md:text-display">Site map</h1>
              <p className="m-0 max-w-[720px] text-body-lg text-ink-muted">
                How the site is organized around Go, Learn and Connect, what everything is called, the paths people
                take, and what we’re testing. Built from the site map sheets, so it stays current as they change.
              </p>
            </div>
            <dl className="m-0 grid grid-cols-2 gap-px border border-border-strong bg-border-strong md:grid-cols-3 xl:grid-cols-6">
              {stats.map(([k, v]) => (
                <div key={k} className="flex flex-col justify-between gap-2 bg-bg p-3">
                  <dt className="text-small text-ink-muted">{k}</dt>
                  <dd className="m-0 text-h3 font-normal text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-3 text-small">
              <span className="text-ink-muted">Areas:</span>
              {areas.map((a) => (
                <span key={a.name} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3" style={{ background: colors.get(a.pages[0]) }} />
                  {a.name}
                </span>
              ))}
              <span className="flex items-center gap-2">
                <span aria-hidden="true" className="size-3" style={{ background: colors.get('Home') }} />
                Home
              </span>
              <span className="ml-auto flex flex-wrap gap-x-4 gap-y-1">
                <a
                  href={csvHref(siteMapCsv)}
                  download="site-map.csv"
                  className="text-link underline underline-offset-4"
                >
                  site-map.csv
                </a>
                <a
                  href={csvHref(tasksCsv)}
                  download="site-map-tasks.csv"
                  className="text-link underline underline-offset-4"
                >
                  site-map-tasks.csv
                </a>
                <a
                  href={csvHref(areasCsv)}
                  download="site-map-areas.csv"
                  className="text-link underline underline-offset-4"
                >
                  site-map-areas.csv
                </a>
              </span>
            </div>
          </header>

          {SECTIONS.map((s, i) => (
            <Section key={s.id} index={i} id={s.id} title={s.title} intro={s.intro}>
              {content[s.id]}
            </Section>
          ))}
        </div>
      </div>
    </div>
  );
}
