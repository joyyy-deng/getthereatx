import { Link, useSearchParams } from 'react-router-dom';
import { LinkIn, PageLoading, ResourceList, ResourceRow, Tabs } from '../components/ui';
import type { Resource } from '../content/schema';
import { getPageContent, getResources, getStudentTabs } from '../data';
import { text } from '../lib/i18n';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Student resources (Figma 358:2035), organized by need. The open tab is in the URL.
// Wording comes from content/pages.json ("students"); tabs from student-tabs.json.

export function StudentResources() {
  const [params, setParams] = useSearchParams();
  const data = useContent(async () => {
    const [copy, tabs, resources] = await Promise.all([getPageContent(), getStudentTabs(), getResources()]);
    return { copy: copy.students, tabs, resources: indexBy(resources) };
  });

  if (!data?.tabs.length) return <PageLoading />;
  const { copy, tabs, resources } = data;
  const current = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0];
  const rows = current.resourceIds.map((id) => resources.get(id)).filter((r): r is Resource => !!r);

  return (
    <div className="px-6 pb-16 md:px-8 md:pb-24">
      <div className="mx-auto max-w-content">
        <Link
          to="/resources"
          className="mt-8 inline-flex items-center gap-2 text-small text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          <span aria-hidden="true">←</span> Back to Resources
        </Link>
        {/* Figma order: the GetThereTogether callout sits above the heading. */}
        <div className="pt-8">
          <aside className="flex flex-col gap-2 border-l-[3px] border-border-strong pl-6">
            <h2 className="m-0 text-h3 font-normal text-ink">{copy.callout.title}</h2>
            <p className="m-0 text-body text-ink-muted">{copy.callout.body}</p>
            <p className="m-0 text-small">
              <LinkIn to="/community" label={copy.callout.link} />
            </p>
          </aside>
        </div>
        <header className="flex flex-col gap-6 pb-12 pt-12 md:pb-[60px] md:pt-[80px]">
          <h1 className="m-0 text-h1 text-ink md:text-display">{copy.title}</h1>
          <p className="m-0 max-w-[650px] text-body-lg text-ink-muted">{copy.intro}</p>
        </header>
      </div>
      <hr className="mx-auto my-0 h-px max-w-[1157px] border-0 bg-border-strong" />
      <div className="mx-auto max-w-content">
        <Tabs
          label="Student trip types"
          items={tabs.map((t) => ({ id: t.id, label: text(t.label) }))}
          value={current.id}
          onChange={(id) => setParams({ tab: id }, { replace: true, preventScrollReset: true })}
        >
          <ResourceList>
            {rows.map((r) => (
              <ResourceRow key={r.id} resource={r} from="students" />
            ))}
          </ResourceList>
        </Tabs>
      </div>
    </div>
  );
}
