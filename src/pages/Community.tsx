import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ConnectCards } from '../components/ConnectCards';
import { Eyebrow, LinkOut, SectionHeader, STRETCHED_LINK, Tabs } from '../components/ui';
import type { ConnectCard, ExplorePlace, Resource } from '../content/schema';
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS, type PlaceCategory } from '../content/taxonomies';
import { getConnectCards, getEvents, getExplorePlaces, getResources, type Occurrence } from '../data';
import { cx } from '../lib/cx';
import { nextText, recurrenceText } from '../lib/eventText';
import { text } from '../lib/i18n';
import { asset } from '../lib/asset';

// Community (Figma 360:2221): Get There Together → Upcoming Events → Explore Austin.

const DAYS_AHEAD = 120;

interface Data {
  cards: ConnectCard[];
  resources: Map<string, Resource>;
  /** Next occurrence of each event, soonest first. */
  events: Occurrence[];
  places: ExplorePlace[];
}

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

export function Community() {
  const [data, setData] = useState<Data>();
  const { hash } = useLocation();

  useEffect(() => {
    const now = new Date();
    Promise.all([
      getConnectCards(),
      getResources(),
      getEvents({ from: now, to: new Date(now.getTime() + DAYS_AHEAD * 86_400_000) }),
      getExplorePlaces(),
    ]).then(([cards, resources, occurrences, places]) => {
      // One slide per event: its next date. Recurring events are one record.
      const seen = new Set<string>();
      const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
      setData({ cards, resources: new Map(resources.map((r) => [r.id, r])), events, places });
    });
  }, []);

  // /community#events (from the Resources "I'm going to an event" card).
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [data, hash]);

  if (!data) return <div className="min-h-screen" aria-busy="true" />;

  return (
    <>
      {/* Get There Together */}
      <section className="relative px-8 py-24">
        <img
          src={asset('/images/community/hero.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.3)]" />
        <div className="relative mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader level={1} size="display" tone="light" eyebrow="Community" title="Get There Together" />
          <ConnectCards cards={data.cards} resources={data.resources} from="community" bordered={false} />
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" aria-labelledby="events-title" className="scroll-mt-[140px]">
        <div className="px-8 pb-6 pt-24">
          <div className="mx-auto max-w-content py-3">
            <SectionHeader id="events-title" size="display" eyebrow="New" title="Upcoming Events" />
          </div>
        </div>
        <EventCarousel events={data.events} />
      </section>

      {/* Explore Austin */}
      <ExploreAustin places={data.places} />
    </>
  );
}

function EventCarousel({ events }: { events: Occurrence[] }) {
  const [index, setIndex] = useState(0);
  if (!events.length) {
    return <p className="mx-auto max-w-content px-8 text-body text-ink-muted">No upcoming events right now.</p>;
  }
  const current = events[index];
  const { event } = current;
  const repeats = recurrenceText(event);
  const go = (step: number) => setIndex((i) => (i + step + events.length) % events.length);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Upcoming events"
      className="relative h-[484px] overflow-hidden bg-ink"
    >
      {event.image && (
        <>
          {/* Blurred fill behind, whole image in front, so posters aren't cropped. */}
          <img
            src={asset(event.image.src)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-xl"
          />
          <img
            src={asset(event.image.src)}
            alt={event.image.alt}
            className="absolute inset-y-0 left-[120px] h-full w-[45%] object-contain object-left"
          />
        </>
      )}

      <div
        aria-live="polite"
        aria-atomic="true"
        className="absolute bottom-[60px] right-[120px] flex w-[560px] flex-col items-end gap-3 bg-bg p-[36px] text-right"
      >
        <p className="sr-only">
          Event {index + 1} of {events.length}
        </p>
        <h3 className="m-0 text-h1 text-ink">{text(event.title)}</h3>
        <p className="m-0 font-mono text-data text-ink">
          {repeats && (
            <>
              {repeats}
              <br />
              Next:{' '}
            </>
          )}
          {nextText(current.start, current.end)}
        </p>
        <p className="m-0 text-small text-ink-muted">
          {event.venue.address.startsWith(event.venue.name)
            ? event.venue.address
            : `${event.venue.name}, ${event.venue.address}`}
        </p>
        <p className="m-0 text-small text-ink-muted">{text(event.blurb)}</p>
        {event.url && (
          <p className="m-0 text-small">
            <LinkOut
              href={event.url}
              provider={host(event.url)}
              label="Learn more"
              from="community"
              className={STRETCHED_LINK}
            />
          </p>
        )}
      </div>

      {events.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous event"
            className="absolute left-[37px] top-1/2 size-[58px] -translate-y-1/2 rounded-pill transition-colors duration-hover hover:bg-white/10"
          >
            <img src={asset('/icons/chevron-right.svg')} alt="" width={58} height={58} className="block -scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next event"
            className="absolute right-[15px] top-1/2 size-[58px] -translate-y-1/2 rounded-pill transition-colors duration-hover hover:bg-white/10"
          >
            <img src={asset('/icons/chevron-right.svg')} alt="" width={58} height={58} className="block" />
          </button>
        </>
      )}
    </div>
  );
}

function ExploreAustin({ places }: { places: ExplorePlace[] }) {
  const [tab, setTab] = useState<'all' | PlaceCategory>('all');
  const shown = tab === 'all' ? places : places.filter((p) => p.categories.includes(tab));

  return (
    <section className="px-8 py-24">
      <div className="mx-auto flex max-w-content flex-col gap-6">
        <SectionHeader
          size="display"
          eyebrow="Connect"
          title="Explore Austin"
          aside={<span className="block text-right">Find places in Austin to go to, and learn how to get there.</span>}
          className="border-b border-border-strong py-3"
        />
        <Tabs
          label="Place types"
          items={[
            { id: 'all', label: 'All' },
            ...PLACE_CATEGORIES.map((c) => ({ id: c, label: PLACE_CATEGORY_LABELS[c] })),
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'all' | PlaceCategory)}
        >
          <ul className="m-0 grid list-none grid-cols-3 gap-4 p-0">
            {shown.map((p) => (
              <li
                key={p.id}
                className="group relative flex flex-col gap-4 border border-border-strong p-[20px] transition-colors duration-hover hover:bg-surface-muted"
              >
                <div className="aspect-square w-full overflow-hidden">
                  <img src={asset(p.image.src)} alt={p.image.alt} loading="lazy" className="size-full object-cover" />
                </div>
                <h3 className="m-0 text-nav font-normal text-ink">{text(p.name)}</h3>
                <Eyebrow>{p.categories.map((c) => PLACE_CATEGORY_LABELS[c]).join(' • ')}</Eyebrow>
                <p className={cx('m-0 text-small')}>
                  <LinkOut
                    href={p.url}
                    provider={p.provider}
                    label="Learn more"
                    from="community"
                    className={STRETCHED_LINK}
                  />
                </p>
              </li>
            ))}
          </ul>
        </Tabs>
      </div>
    </section>
  );
}
