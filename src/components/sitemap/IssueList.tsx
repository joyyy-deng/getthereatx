import { isIssue, type SiteMapRow } from '../../lib/sitemap';

/** Everything to fix, grouped: broken links and placeholders from the site map, plus sheet problems. */
export function IssueList({ rows, sheetWarnings }: { rows: SiteMapRow[]; sheetWarnings: string[] }) {
  const broken = rows.filter((r) => isIssue(r) && /broken/i.test(r.notes + r.testStatus));
  const placeholders = rows.filter((r) => isIssue(r) && !broken.includes(r));
  const groups = [
    {
      title: 'Broken',
      tone: 'bg-alert-disruption-bg text-alert-disruption-ink',
      items: broken.map((r) => `${r.page === 'Every page' ? 'Footer / nav' : r.page}: “${r.label}”. ${r.notes}`),
    },
    {
      title: 'Placeholders',
      tone: 'bg-alert-advisory-bg text-alert-advisory-ink',
      items: placeholders.map((r) => `${r.page === 'Every page' ? 'Footer / nav' : r.page}: “${r.label}”. ${r.notes}`),
    },
    { title: 'Client sheet (Trip Planning)', tone: 'bg-alert-info-bg text-alert-info-ink', items: sheetWarnings },
  ].filter((g) => g.items.length);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((g) => (
        <div key={g.title} className={`flex flex-col gap-2 p-4 ${g.tone}`}>
          <p className="m-0 flex items-baseline justify-between text-body font-medium">
            {g.title}
            <span className="font-mono text-data">{g.items.length}</span>
          </p>
          <ul className="m-0 flex list-disc flex-col gap-1 pl-4 text-small">
            {g.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
