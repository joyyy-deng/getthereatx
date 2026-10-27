import { Link } from 'react-router-dom';
import type { Persona } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';

/**
 * "Which sounds most like you?" cards. Each one either links to a page
 * (`to`) or sets the directory's tag / Transportation filter (`filter`).
 * Phones: stacked black rows. Tablet: 2 across. Desktop: 4 tiles.
 */
export function PersonaCards({
  personas,
  who,
  mode,
  onFilter,
}: {
  personas: Persona[];
  who?: string;
  mode?: string;
  onFilter: (filter: { who: string | null; mode: string | null }) => void;
}) {
  return (
    <div className="flex flex-col md:grid md:grid-cols-2 md:border-b md:border-border-strong lg:grid-cols-4">
      {personas.map((p, i) => {
        const cls = cx(
          'flex items-center justify-between gap-4 border-t border-white/40 bg-ink px-4 py-3 text-left text-white transition-opacity duration-hover first:border-t-0 hover:opacity-90',
          'md:min-h-[330px] md:flex-col md:items-stretch md:border-l md:border-t md:border-white md:p-[28px] md:first:border-t',
          i % 2 === 1 && 'md:border-r lg:border-r-0',
          i === personas.length - 1 && 'lg:border-r',
        );
        const body = (
          <>
            <span className="flex flex-col gap-1 md:gap-4 md:pt-12">
              <span className="text-body font-normal md:text-h3">{text(p.title)}</span>
              <span className="text-label normal-case tracking-normal text-white/80 md:text-small md:text-white">
                {text(p.body)}
              </span>
            </span>
            <span className="hidden text-small md:inline">View options →</span>
            <span aria-hidden="true" className="text-body md:hidden">
              →
            </span>
          </>
        );

        if (p.to) {
          return (
            <Link key={p.id} to={p.to} className={cls}>
              {body}
            </Link>
          );
        }
        const active = (p.filter?.who && p.filter.who === who) || (p.filter?.mode && p.filter.mode === mode);
        return (
          <button
            key={p.id}
            type="button"
            aria-pressed={!!active}
            onClick={() => onFilter({ who: p.filter?.who ?? null, mode: p.filter?.mode ?? null })}
            className={cx(cls, active && 'outline outline-4 -outline-offset-8 outline-white')}
          >
            {body}
          </button>
        );
      })}
    </div>
  );
}
