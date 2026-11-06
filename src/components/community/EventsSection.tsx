import type { ReactNode } from 'react';
import type { Occurrence } from '../../data';
import { asset } from '../../lib/asset';
import { dateRail, nextText, recurrenceText } from '../../lib/eventText';
import { text } from '../../lib/i18n';
import { track } from '../../lib/track';

export interface EventsCopy {
  title: string;
  featuredLabel: string;
  linkLabel: string;
  empty: string;
}

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
 * Figma "Things to do this weekend" (787:5340), without its filter row: one
 * featured event with a photo, then an agenda of the next events beside
 * `aside` (Explore Austin). One entry per event (its next date); recurring
 * events are one record.
 */
export function EventsSection({ events, copy, aside }: { events: Occurrence[]; copy: EventsCopy; aside: ReactNode }) {
  // Featured: the next event that has a photo. The rest go in the agenda.
  const featured = events.find((o) => o.event.image);
  const agenda = events.filter((o) => o !== featured).slice(0, 4);

  return (
    <section id="events" aria-labelledby="events-title" className="scroll-mt-[96px] px-page py-10 lg:py-14">
      <div className="flex flex-col gap-7 lg:gap-10">
        <h2
          id="events-title"
          className="m-0 text-title font-medium text-ink"
        >
          {copy.title}
        </h2>

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
              <p className="m-0 text-caption uppercase tracking-[1.4px] text-ink">{copy.featuredLabel}</p>
              <h3 className="m-0 text-title font-medium text-ink">
                {text(featured.event.title)}
              </h3>
              <p className="m-0 text-fine text-ink">
                {nextText(featured.start, featured.end)}
                {recurrenceText(featured.event) && <> · {recurrenceText(featured.event)}</>}
              </p>
              <p className="m-0 text-copy text-ink-soft">{text(featured.event.blurb)}</p>
              <EventLink
                o={featured}
                label={`${copy.linkLabel}: ${text(featured.event.title)}, opens in a new tab`}
                className="flex min-h-[56px] items-center gap-2 bg-charcoal px-4 text-fine font-medium text-white transition-opacity duration-hover hover:opacity-90 lg:min-h-[44px] lg:gap-3 lg:px-5 lg:font-semibold"
              >
                {copy.linkLabel}
                <span aria-hidden="true" className="text-lead font-normal">
                  ↗
                </span>
              </EventLink>
            </div>
          </article>
        )}

        <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:gap-14">
          {events.length === 0 ? (
            <p className="m-0 border-t border-line py-6 text-copy text-ink-muted lg:w-[46%]">{copy.empty}</p>
          ) : (
            agenda.length > 0 && (
              <ul className="m-0 flex list-none flex-col p-0 lg:w-[46%] lg:shrink-0 lg:gap-[13px]">
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
                          <span className="text-caption">{rail.month}</span>
                          <span className="text-numeral text-charcoal">{rail.day}</span>
                          <span className="text-caption">{rail.weekday}</span>
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-[7px]">
                          {o.event.tags[0] && (
                            <span className="text-caption uppercase tracking-[1.4px] text-ink-soft">
                              {o.event.tags[0]}
                            </span>
                          )}
                          <span className="text-heading font-medium text-ink group-hover:underline">
                            {text(o.event.title)}
                          </span>
                          <span className="text-fine text-ink-soft">{text(o.event.blurb)}</span>
                        </span>
                        <span aria-hidden="true" className="flex min-h-[44px] items-center text-lead text-ink-soft">
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
