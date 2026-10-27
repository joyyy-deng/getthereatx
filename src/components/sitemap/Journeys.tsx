import type { SiteMapTask } from '../../lib/sitemap';

/**
 * Key journeys: each test task as a click path. Steps that are pages take that
 * page's area color; steps that are a button or choice on a page are outlined.
 */
export function Journeys({ tasks, colors }: { tasks: SiteMapTask[]; colors: Map<string, string> }) {
  const pageOf = (step: string) => [...colors.keys()].find((p) => step === p || step.startsWith(`${p} (`));
  return (
    <ol className="m-0 grid list-none gap-4 p-0 lg:grid-cols-2">
      {tasks.map((t, i) => (
        <li key={i} className="flex flex-col gap-3 border border-border-strong p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-8 shrink-0 place-items-center bg-ink font-mono text-data text-white">
              {i + 1}
            </span>
            <div className="flex flex-col gap-1">
              <p className="m-0 text-body font-medium text-ink">{t.task}</p>
              <p className="m-0 text-small text-ink-muted">
                {t.who} · starts on {t.start}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            {t.path.map((step, j) => {
              const page = pageOf(step);
              const color = page && colors.get(page);
              return (
                <span key={j} className="flex items-center gap-1">
                  {j > 0 && (
                    <span aria-hidden="true" className="text-ink-muted">
                      →
                    </span>
                  )}
                  <span
                    className={
                      color
                        ? 'px-2 py-1 text-small text-white'
                        : 'border border-ink-muted px-2 py-1 text-small text-ink'
                    }
                    style={color ? { background: color } : undefined}
                  >
                    {step}
                  </span>
                </span>
              );
            })}
          </div>
          <p className="m-0 text-small text-ink-muted">
            <span className="text-ink">Done when:</span> {t.doneWhen}
            {t.path.length > 0 && ` · ${t.path.length} steps`}
          </p>
          {t.notes && <p className="m-0 border-l-2 border-border-strong pl-3 text-small text-ink-muted">{t.notes}</p>}
        </li>
      ))}
    </ol>
  );
}
