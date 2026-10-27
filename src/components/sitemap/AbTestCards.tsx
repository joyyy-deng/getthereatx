import { Link } from 'react-router-dom';
import { AB_TESTS, type AbTest } from '../../lib/abTests';
import { areaColor } from '../../lib/sitemap';

/** The A/B tests in lib/abTests.ts, with their research question and a link per version. */
export function AbTestCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(Object.keys(AB_TESTS) as AbTest[]).map((id) => {
        const t = AB_TESTS[id];
        const area = t.label.split(' ')[0];
        return (
          <article
            key={id}
            className="flex flex-col gap-3 border border-border-strong p-4"
            style={{ borderTop: `4px solid ${areaColor(area)}` }}
          >
            <h3 className="m-0 text-h4 font-normal">{t.label}</h3>
            <p className="m-0 text-body text-ink">“{t.question}”</p>
            <p className="m-0 text-small text-ink-muted">A: the current page. {t.change}</p>
            <p className="m-0 flex flex-wrap gap-2 pt-1">
              {t.versions.map((v) => (
                <Link
                  key={v}
                  to={`/${id}=${v}`}
                  target="_blank"
                  className="border border-ink px-3 py-1 font-mono text-data text-ink hover:bg-ink hover:text-white"
                >
                  /{id}={v} ↗
                </Link>
              ))}
            </p>
          </article>
        );
      })}
    </div>
  );
}
