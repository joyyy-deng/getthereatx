import { useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Occurrence } from '../../data';
import { asset } from '../../lib/asset';
import { dateRail, nextText, recurrenceText } from '../../lib/eventText';
import { text } from '../../lib/i18n';
import { track } from '../../lib/track';
import { FilterSelect } from '../ui/FilterSelect';

export interface EventsCopy {
  title: string;
  typeLabel: string;
  dateLabel: string;
  locationLabel: string;
  featuredLabel: string;
  linkLabel: string;
  empty: string;
}

const DATE_RANGES = [
  { value: 'week', label: 'Next 7 days', days: 7 },
  { value: 'month', label: 'Next 30 days', days: 30 },
];

const unique = (list: string[]) => [...new Set(list)].sort((a, b) => a.localeCompare(b));

/** Opens an event's own page in a new tab, and logs the hand-off. */
function EventLink({ o, className, children, label }: { o: Occurrence; className?: string; children: ReactNode; label: string }) {
  const url = o.event.url;
  if (!url) return <div className={className}>{children}</div>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      onClick={() => track('handoff', { resourceId: `event:${o.event.id}`, from: 'community', href: url })}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Figma "Things to do this weekend" (787:5340): filters, one featured event
 * with a photo, then an agenda of the next events beside `aside` (Explore Austin).
 * One entry per event (its next date); recurring events are one record.
 * Filters live in the URL: /community?type=…&date=week&where=…
 */
export function EventsSection({ events, copy, aside }: { events: Occurrence[]; copy: EventsCopy; aside: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const type = params.get('type') ?? '';
  const date = params.get('date') ?? '';
  const where = params.get('where') ?? '';

  const typeOptions = useMemo(() => unique(events.flatMap((o) => o.event.tags)), [events]);
  const placeOptions = useMemo(() => unique(events.map((o) => o.event.venue.name)), [events]);

  const shown = events.filter((o) => {
    const range = DATE_RANGES.find((r) => r.value === date);
    if (range && o.start.getTime() > Date.now() + range.days * 86_400_000) return false;
    if (type && !o.event.tags.includes(type)) return false;
    if (where && o.event.venue.name !== where) return false;
    return true;
  });
  // Featured: the next event that has a photo. The rest go in the agenda.
  const featured = shown.find((o) => o.event.image);
  const agenda = shown.filter((o) => o !== featured).slice(0, 4);

  function set(key: string, value: string) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (value) p.set(key, value);
        else p.delete(key);
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  return (
    <section id="events" aria-labelledby="events-title" className="scroll-mt-[96px] px-6 py-10 lg:px-32 lg:py-14">
      <div className="mx-auto flex max-w-frame flex-col gap-7 lg:gap-10">
        <h2
          id="events-title"
          className="m-0 text-[34px] font-medium leading-[1.08] tracking-[-0.03em] text-ink lg:text-[42px] lg:leading-[1.06] lg:tracking-[-2px]"
        >
          {copy.title}
        </h2>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <FilterSelect
            label={copy.typeLabel}
            value={type}
            onChange={(v) => set('type', v)}
            options={[{ value: '', label: copy.typeLabel }, ...typeOptions.map((t) => ({ value: t, label: t }))]}
            className="col-span-2 sm:w-[200px]"
          />
          <FilterSelect
            label={copy.dateLabel}
            value={date}
            onChange={(v) => set('date', v)}
            options={[{ value: '', label: copy.dateLabel }, ...DATE_RANGES]}
            className="sm:w-[160px]"
          />
          <FilterSelect
            label={copy.locationLabel}
            value={where}
            onChange={(v) => set('where', v)}
            options={[{ value: '', label: copy.locationLabel }, ...placeOptions.map((p) => ({ value: p, label: p }))]}
            className="sm:w-[220px]"
          />
        </div>

        {featured && (
          <article className="flex flex-col md:flex-row md:items-stretch">
            <div className="h-[240px] bg-sky md:h-auto md:min-h-[332px] md:flex-1">
              <img
                src={asset(featured.event.image!.src)}
                alt={featured.event.image!.alt}
                className="block size-full object-cover"
              />
            </div>
            <div className="flex flex-col items-start gap-[18px] bg-mist p-6 md:flex-1 lg:p-9">
              <p className="m-0 text-[12px] uppercase leading-[15px] tracking-[1.4px] text-ink">{copy.featuredLabel}</p>
              <h3 className="m-0 text-[36px] font-medium leading-[1.08] tracking-[-0.03em] text-ink lg:text-[52px] lg:leading-[1.06] lg:tracking-[-2px]">
                {text(featured.event.title)}
              </h3>
              <p className="m-0 text-[14px] leading-[1.5] text-ink lg:text-[16px]">
                {nextText(featured.start, featured.end)}
                {recurrenceText(featured.event) && <> · {recurrenceText(featured.event)}</>}
              </p>
              <p className="m-0 text-[16px] leading-[1.5] text-ink-soft">{text(featured.event.blurb)}</p>
              <EventLink
                o={featured}
                label={`${copy.linkLabel}: ${text(featured.event.title)}, opens in a new tab`}
                className="flex min-h-[56px] items-center gap-2 bg-charcoal px-4 text-[14px] font-medium text-white transition-opacity duration-hover hover:opacity-90 lg:min-h-[44px] lg:gap-3 lg:px-5 lg:font-semibold"
              >
                {copy.linkLabel}
                <span aria-hidden="true" className="text-[20px] font-normal lg:text-[18px]">
                  ↗
                </span>
              </EventLink>
            </div>
          </article>
        )}

        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-14">
          {shown.length === 0 ? (
            <p className="m-0 border-t border-line py-6 text-[16px] text-ink-muted lg:w-[520px]">{copy.empty}</p>
          ) : (
            agenda.length > 0 && (
              <ul className="m-0 flex list-none flex-col p-0 lg:w-[520px] lg:shrink-0 lg:gap-[13px]">
                {agenda.map((o) => {
                  const rail = dateRail(o.start);
                  return (
                    <li key={o.event.id}>
                      <EventLink
                        o={o}
                        label={`${text(o.event.title)}, ${nextText(o.start, o.end)}, opens in a new tab`}
                        className="group flex items-start gap-6 border-t border-line py-[22px]"
                      >
                        <span className="flex w-16 shrink-0 flex-col gap-[3px] text-ink-soft" aria-hidden="true">
                          <span className="text-[11px]">{rail.month}</span>
                          <span className="text-[44px] leading-none text-charcoal">{rail.day}</span>
                          <span className="text-[11px]">{rail.weekday}</span>
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
                          {o.event.tags[0] && (
                            <span className="text-[12px] uppercase leading-[15px] tracking-[1.4px] text-ink-soft">
                              {o.event.tags[0]}
                            </span>
                          )}
                          <span className="text-[28px] font-medium leading-[1.06] tracking-[-0.8px] text-ink group-hover:underline">
                            {text(o.event.title)}
                          </span>
                          <span className="text-[14px] leading-[1.5] text-ink-soft">{text(o.event.blurb)}</span>
                        </span>
                        <span aria-hidden="true" className="flex min-h-[44px] items-center text-[18px] text-ink-soft">
                          ↗
                        </span>
                      </EventLink>
                    </li>
                  );
                })}
              </ul>
            )
          )}
          <div className="lg:flex-1">{aside}</div>
        </div>
      </div>
    </section>
  );
}
