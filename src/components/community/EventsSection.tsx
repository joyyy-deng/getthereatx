import { useMemo, useState, type ReactNode } from 'react';
import type { Occurrence } from '../../data';
import { asset } from '../../lib/asset';
import { dateRail, nextText, recurrenceText } from '../../lib/eventText';
import { text } from '../../lib/i18n';
import { Arrow } from '../ui/Arrow';
import { FilterSelect } from '../ui/FilterSelect';
import { PageLink } from '../ui/PageLink';

export interface EventsCopy {
  title: string;
  featuredLabel: string;
  linkLabel: string;
  empty: string;
  noMatch: string;
  filters: { type: string; date: string; location: string; thisWeek: string; thisMonth: string; nextMonth: string };
}

const DAY = 86_400_000;
type DateFilter = '' | 'week' | 'month' | 'next30';

/** Does the event's shown date fall in the chosen window? Austin weeks start Monday. */
function inWindow(start: Date, when: DateFilter, now = new Date()): boolean {
  if (!when) return true;
  if (when === 'next30') return start.getTime() - now.getTime() <= 30 * DAY;
  if (when === 'month') return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return start >= monday && start.getTime() < monday.getTime() + 7 * DAY;
}

/** Opens the event's own page on this site (Figma "Community Event Detail Template"). */
function EventLink({ o, className, children, label }: { o: Occurrence; className?: string; children: ReactNode; label: string }) {
  return (
    <PageLink to={`/community/events/${o.event.slug}`} className={className} label={label}>
      {children}
    </PageLink>
  );
}

/**
 * Figma "Things to do this weekend" (787:5340), without its filter row: one
 * featured event with a photo, then an agenda of the next events beside
 * `aside` (Explore Austin). One entry per event (its next date); recurring
 * events are one record.
 */
export function EventsSection({ events: all, copy, aside }: { events: Occurrence[]; copy: EventsCopy; aside: ReactNode }) {
  // Figma's filter row. Options come from the events themselves (their tags and venues).
  const [type, setType] = useState('');
  const [when, setWhen] = useState<DateFilter>('');
  const [place, setPlace] = useState('');
  const types = useMemo(() => [...new Set(all.flatMap((o) => o.event.tags))].sort(), [all]);
  const places = useMemo(() => [...new Set(all.map((o) => o.event.venue.name))].sort(), [all]);
  const events = all.filter(
    (o) => (!type || o.event.tags.includes(type)) && inWindow(o.start, when) && (!place || o.event.venue.name === place),
  );
  const f = copy.filters;

  // Featured: the next event that has a photo. The rest go in the agenda.
  const featured = events.find((o) => o.event.image);
  const agenda = events.filter((o) => o !== featured).slice(0, 4);

  return (
    <section id="events" aria-labelledby="events-title" className="scroll-mt-[96px] px-article py-10 lg:py-14">
      <div className="flex flex-col gap-7 lg:gap-10">
        <h2
          id="events-title"
          className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:36] [--m:28] lg:leading-[1.05]"
        >
          {copy.title}
        </h2>

        {all.length > 0 && (
          <div role="group" aria-label="Filter events" className="flex flex-wrap gap-2">
            <FilterSelect
              label={f.type}
              value={type}
              onChange={setType}
              options={[{ value: '', label: f.type }, ...types.map((t) => ({ value: t, label: t }))]}
              className="w-auto min-w-[110px]"
            />
            <FilterSelect
              label={f.date}
              value={when}
              onChange={(v) => setWhen(v as DateFilter)}
              options={[
                { value: '', label: f.date },
                { value: 'week', label: f.thisWeek },
                { value: 'month', label: f.thisMonth },
                { value: 'next30', label: f.nextMonth },
              ]}
              className="w-auto min-w-[90px]"
            />
            <FilterSelect
              label={f.location}
              value={place}
              onChange={setPlace}
              options={[{ value: '', label: f.location }, ...places.map((p) => ({ value: p, label: p }))]}
              className="w-auto min-w-[110px]"
            />
          </div>
        )}

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
              <h3 className="m-0 text-fluid font-medium leading-[1.08] tracking-[-0.03em] text-ink [--d:22] [--m:36] lg:font-semibold lg:leading-[28px] lg:tracking-normal">
                {text(featured.event.title)}
              </h3>
              <p className="m-0 text-[14px] leading-[1.5] text-ink lg:leading-[20px] lg:tracking-[0.01em]">
                {nextText(featured.start, featured.end)}
                {recurrenceText(featured.event) && <> · {recurrenceText(featured.event)}</>}
              </p>
              <p className="m-0 text-fluid leading-[1.5] text-ink-soft [--d:14] [--m:16] lg:leading-[20px] lg:tracking-[0.01em]">{text(featured.event.blurb)}</p>
              <EventLink
                o={featured}
                label={`${copy.linkLabel}: ${text(featured.event.title)}`}
                className="flex min-h-[44px] items-center gap-3 bg-charcoal px-4 text-[14px] font-semibold leading-[20px] text-white transition-opacity duration-hover hover:opacity-90 lg:px-5"
              >
                {copy.linkLabel}
                <Arrow className="size-3" strokeWidth={2.5} />
              </EventLink>
            </div>
          </article>
        )}

        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-14">
          {events.length === 0 ? (
            <p className="m-0 border-t border-line py-6 text-[16px] text-ink-muted lg:w-[46%]">{all.length ? copy.noMatch : copy.empty}</p>
          ) : (
            agenda.length > 0 && (
              <ul className="m-0 flex list-none flex-col p-0 lg:w-[46%] lg:shrink-0 lg:gap-[13px]">
                {agenda.map((o) => {
                  const rail = dateRail(o.start);
                  return (
                    <li key={o.event.id}>
                      <EventLink
                        o={o}
                        label={`${text(o.event.title)}, ${nextText(o.start, o.end)}`}
                        className="group flex items-start gap-6 border-t border-line py-[22px]"
                      >
                        <span className="flex w-16 shrink-0 flex-col gap-[3px] text-ink-soft" aria-hidden="true">
                          <span className="text-[11px] leading-[16px] tracking-[0.01em] lg:font-semibold">{rail.month}</span>
                          <span className="text-fluid leading-[1] text-charcoal [--d:45] [--m:44] lg:font-semibold lg:leading-[1.05] lg:tracking-[-0.01em]">{rail.day}</span>
                          <span className="text-[11px] leading-[16px] tracking-[0.01em] lg:font-semibold">{rail.weekday}</span>
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
                          {o.event.tags[0] && (
                            <span className="text-[12px] uppercase leading-[15px] tracking-[1.4px] text-ink-soft">
                              {o.event.tags[0]}
                            </span>
                          )}
                          <span className="text-fluid font-medium leading-[1.06] tracking-[-0.8px] text-ink group-hover:underline [--d:22] [--m:28] lg:font-normal lg:leading-[28px] lg:tracking-normal">
                            {text(o.event.title)}
                          </span>
                          <span className="text-[14px] leading-[1.5] text-ink-soft lg:leading-[20px] lg:tracking-[0.01em]">{text(o.event.blurb)}</span>
                        </span>
                        <span className="flex min-h-[44px] items-center text-ink-soft">
                          <Arrow />
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
