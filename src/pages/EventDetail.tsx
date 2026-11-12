import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowButton, BackLink, Fact, FactPanel, Hero, RelatedCard } from '../components/article/parts';
import { PageLoading } from '../components/ui';
import type { PageContent } from '../content/schema';
import { getEvent, getEvents, getPageContent, type Occurrence } from '../data';
import { cardDateText, longDateText, startEndText } from '../lib/eventText';
import { text } from '../lib/i18n';
import { buildIcs, icsHref } from '../lib/ics';
import { useContent } from '../lib/useContent';
import { NotFound } from './NotFound';

// Community event pages (/community/events/:slug): Figma "Community Event
// Detail Template" (desktop 1014:2549, mobile 1015:277).
//   hero → back link → title, description → details card (date, time, place,
//   cost, ages, registration, Book now, Add to calendar) beside the sections
//   (what to bring, hosted by, accessibility, getting there) → More events.
// Every fact and section is optional and only shows when the event has it.
// In WordPress: The Events Calendar's fields plus our "Event details" ACF group.

type Copy = PageContent['event'];

/** How far ahead "More events" looks. */
const DAYS_AHEAD = 120;

export function EventRoute() {
  const { slug = '' } = useParams();
  return <EventDetail key={slug} slug={slug} />;
}

function EventDetail({ slug }: { slug: string }) {
  const data = useContent(async () => {
    const now = new Date();
    const [copy, occurrence, upcoming] = await Promise.all([
      getPageContent(),
      getEvent(slug, now),
      getEvents({ from: now, to: new Date(now.getTime() + DAYS_AHEAD * 86_400_000) }),
    ]);
    if (!occurrence) return { missing: true as const };
    // One card per other event: its next date.
    const seen = new Set<string>([occurrence.event.id]);
    const more = upcoming.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id)).slice(0, 3);
    return { missing: false as const, copy: copy.event, occurrence, more };
  });

  if (!data) return <PageLoading />;
  if (data.missing) return <NotFound />;
  return <EventView {...data} />;
}

/** The template itself (also /dev/templates/event with Figma's sample text). */
export function EventView({ copy, occurrence, more }: { copy: Copy; occurrence: Occurrence; more: Occurrence[] }) {
  const e = occurrence.event;

  return (
    <article>
      <Hero image={e.image} />

      <header className="flex flex-col gap-5 px-article py-6 md:gap-[59px] md:pb-[30px] md:pt-10">
        <BackLink to="/community#events" label={copy.backLabel} />
        <div className="flex flex-col gap-3 md:gap-5">
          <h1 className="m-0 text-a-title-event font-bold text-ink">{text(e.title)}</h1>
          <p className="m-0 max-w-[760px] text-a-lead-event text-ink-soft">{text(e.blurb)}</p>
        </div>
      </header>

      {/* Phones and tablets: the details card first. Desktop: sections left, card right (Figma: 80px apart). */}
      <div className="flex flex-col gap-8 px-article pb-10 lg:flex-row lg:items-start lg:gap-[80px] lg:pb-16 lg:pt-4">
        <DetailsCard copy={copy} occurrence={occurrence} />

        <div className="flex min-w-0 flex-1 flex-col gap-10 pt-2 lg:order-first lg:gap-12 lg:pt-0">
          {e.whatToBring && (
            <Section title={copy.bringTitle}>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {e.whatToBring.map((item, i) => (
                  <li key={i} className="flex gap-3 text-a-body text-charcoal">
                    <span aria-hidden="true">•</span>
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {(e.organizer || e.contact) && (
            <Section title={copy.hostedTitle}>
              {e.organizer && (
                <p className="m-0 whitespace-pre-wrap text-a-body text-charcoal">
                  {[e.organizer.name, e.organizer.partners].filter(Boolean).join('  ·  ')}
                </p>
              )}
              {e.contact && <p className="m-0 text-a-body text-charcoal">{e.contact}</p>}
            </Section>
          )}
          {e.accessibility && (
            <Section title={copy.accessibilityTitle}>
              <p className="m-0 text-a-body text-charcoal">{e.accessibility}</p>
            </Section>
          )}
          {e.gettingThere && (
            <Section title={copy.gettingThereTitle}>
              <FactPanel tight>
                {e.gettingThere.map((way, i) => (
                  <Fact key={i} label={way.label}>
                    {way.details}
                  </Fact>
                ))}
              </FactPanel>
            </Section>
          )}
        </div>
      </div>

      {more.length > 0 && <MoreEvents copy={copy} events={more} />}
    </article>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="m-0 text-a-h2-event font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

/** Figma "Event details card": the facts, a divider, Book now and Add to calendar. */
function DetailsCard({ copy, occurrence }: { copy: Copy; occurrence: Occurrence }) {
  const e = occurrence.event;
  const ics = buildIcs(occurrence);
  return (
    <aside aria-label="Event details" className="flex w-full shrink-0 flex-col gap-4 bg-mist p-6 lg:w-[384px] lg:gap-[25px] lg:p-8">
      <dl className="m-0 flex flex-col gap-4 lg:gap-[25px]">
        <Fact label={copy.labels.date}>{longDateText(occurrence.start)}</Fact>
        <Fact label={copy.labels.time}>{startEndText(occurrence.start, occurrence.end)}</Fact>
        <Fact label={copy.labels.location}>
          <span className="block">{e.venue.name}</span>
          <span className="block">{e.venue.address}</span>
        </Fact>
        {e.cost && <Fact label={copy.labels.cost}>{e.cost}</Fact>}
        {e.ages && <Fact label={copy.labels.ages}>{e.ages}</Fact>}
        {e.registration && <Fact label={copy.labels.registration}>{e.registration}</Fact>}
      </dl>
      <div aria-hidden="true" className="h-px w-full bg-sky" />
      <div className="flex flex-col gap-3">
        {e.url && <ArrowButton href={e.url} label={copy.bookButton} stretch from="event" />}
        <ArrowButton href={icsHref(ics)} download={`${e.slug}.ics`} label={copy.calendarButton} tone="outline" stretch />
      </div>
    </aside>
  );
}

/**
 * Figma "More events": leaf band, three event cards. The title is ink, not
 * Figma's white: white on #74ab60 is 2.7:1, below the WCAG minimum.
 */
function MoreEvents({ copy, events }: { copy: Copy; events: Occurrence[] }) {
  return (
    <section aria-labelledby="more-events-title" className="flex flex-col gap-6 border-t border-sky bg-leaf px-article py-10 md:gap-10 md:py-[80px]">
      <h2 id="more-events-title" className="m-0 text-a-section-event font-bold text-ink">
        {copy.moreTitle}
      </h2>
      <ul className="m-0 grid list-none gap-4 p-0 md:grid-cols-3 md:gap-6">
        {events.map((o) => (
          <li key={o.event.id} className="min-w-0">
            <RelatedCard
              to={`/community/events/${o.event.slug}`}
              image={o.event.image}
              eyebrow={cardDateText(o.start)}
              title={text(o.event.title)}
              action={copy.viewEvent}
              imageClass="h-[160px]"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
