import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ConnectCards } from '../components/ConnectCards';
import { EventCarousel } from '../components/community/EventCarousel';
import { ExploreAustin } from '../components/community/ExploreAustin';
import { PageLoading, SectionHeader } from '../components/ui';
import { getConnectCards, getEvents, getExplorePlaces, getPageContent, getResources } from '../data';
import { asset } from '../lib/asset';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Community (Figma 360:2221): Get There Together → Upcoming Events → Explore Austin.
// Wording comes from content/pages.json ("community").

/** How far ahead the events carousel looks. */
const DAYS_AHEAD = 120;

export function Community() {
  const { hash } = useLocation();
  const data = useContent(async () => {
    const now = new Date();
    const [copy, cards, resources, occurrences, places] = await Promise.all([
      getPageContent(),
      getConnectCards(),
      getResources(),
      getEvents({ from: now, to: new Date(now.getTime() + DAYS_AHEAD * 86_400_000) }),
      getExplorePlaces(),
    ]);
    // One slide per event: its next date. Recurring events are one record.
    const seen = new Set<string>();
    const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
    return { copy: copy.community, cards, resources: indexBy(resources), events, places };
  });

  // /community#events (from the Resources "I'm going to an event" card).
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [data, hash]);

  if (!data) return <PageLoading />;
  const { copy } = data;

  return (
    <>
      {/* Get There Together */}
      <section className="relative px-6 py-16 md:px-8 md:py-24">
        <img
          src={asset('/images/community/hero.png')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.3)]" />
        <div className="relative mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader level={1} size="display" tone="light" eyebrow={copy.hero.eyebrow} title={copy.hero.title} />
          <ConnectCards cards={data.cards} resources={data.resources} from="community" bordered={false} />
        </div>
      </section>

      {/* Upcoming Events */}
      <section id="events" aria-labelledby="events-title" className="scroll-mt-[140px]">
        <div className="px-6 pb-6 pt-16 md:px-8 md:pt-24">
          <div className="mx-auto max-w-content py-3">
            <SectionHeader id="events-title" size="display" eyebrow={copy.events.eyebrow} title={copy.events.title} />
          </div>
        </div>
        <EventCarousel events={data.events} empty={copy.events.empty} />
      </section>

      <ExploreAustin places={data.places} copy={copy.explore} />
    </>
  );
}
