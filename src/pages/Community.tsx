import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { EventsSection } from '../components/community/EventsSection';
import { TogetherBand } from '../components/TogetherBand';
import { MascotCard, PageLoading } from '../components/ui';
import { getConnectCards, getEvents, getPageContent, getResources } from '../data';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Community (Figma desktop 787:5332, mobile 865:6182): Get there together →
// events (featured + agenda) beside Explore Austin.
// Wording comes from content/pages.json ("community").

/** How far ahead the events list looks. */
const DAYS_AHEAD = 120;

export function Community() {
  const { hash } = useLocation();
  const data = useContent(async () => {
    const now = new Date();
    const [copy, cards, resources, occurrences] = await Promise.all([
      getPageContent(),
      getConnectCards(),
      getResources(),
      getEvents({ from: now, to: new Date(now.getTime() + DAYS_AHEAD * 86_400_000) }),
    ]);
    // One entry per event: its next date. Recurring events are one record.
    const seen = new Set<string>();
    const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
    return { copy: copy.community, cards, resources: indexBy(resources), events };
  });

  // /community#events (the "Find your community" button, the Resources persona card).
  useEffect(() => {
    if (data && hash) document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [data, hash]);

  if (!data) return <PageLoading />;
  const { copy } = data;

  return (
    <>
      <TogetherBand
        title={copy.together.title}
        button={copy.together.button}
        cards={data.cards}
        resources={data.resources}
        from="community"
        variant="community"
        bodies={copy.together.cardBodies}
        headingLevel={1}
      />
      <EventsSection
        events={data.events}
        copy={copy.events}
        aside={
          <MascotCard
            title={copy.explore.title}
            to={copy.explore.to}
            tone="leaf"
            layout="side"
            titleSize={[36, 45]}
            mascot={{ src: '/images/mascots/austin-dog.svg', flip: true }}
          />
        }
      />
    </>
  );
}
