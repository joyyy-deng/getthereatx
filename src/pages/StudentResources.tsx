import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LinkIn, ResourceList, ResourceRow, Tabs } from '../components/ui';
import type { Resource, StudentTab } from '../content/schema';
import { getResources, getStudentTabs } from '../data';
import { text } from '../lib/i18n';

// Student resources (Figma 358:2035), organized by need. The open tab is in the URL.

export function StudentResources() {
  const [tabs, setTabs] = useState<StudentTab[]>([]);
  const [resources, setResources] = useState<Map<string, Resource>>(new Map());
  const [params, setParams] = useSearchParams();

  useEffect(() => {
    Promise.all([getStudentTabs(), getResources()]).then(([t, r]) => {
      setTabs(t);
      setResources(new Map(r.map((x) => [x.id, x])));
    });
  }, []);

  if (!tabs.length) return <div className="min-h-screen" aria-busy="true" />;

  const current = tabs.find((t) => t.id === params.get('tab')) ?? tabs[0];
  const rows = current.resourceIds.map((id) => resources.get(id)).filter((r): r is Resource => !!r);

  return (
    <div className="px-8 pb-24">
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
            <h2 className="m-0 text-h3 font-normal text-ink">Want to learn from other students?</h2>
            <p className="m-0 text-body text-ink-muted">
              GetThereTogether is separate from UT transportation services. Find advice from other students about public
              transit and things first-time riders should know.
            </p>
            <p className="m-0 text-small">
              <LinkIn to="/community" label="Go to GetThereTogether" />
            </p>
          </aside>
        </div>
        <header className="flex flex-col gap-6 pb-[60px] pt-[80px]">
          <h1 className="m-0 text-display text-ink">How can I get around as a student?</h1>
          <p className="m-0 max-w-[650px] text-body-lg text-ink-muted">
            Choose a type of trip to see the services available to UT students.
          </p>
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
