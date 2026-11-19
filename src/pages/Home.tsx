import { Fragment } from 'react';
import { CapitolIllustration } from '../components/home/CapitolIllustration';
import { GuideAccordion, type GuideItem } from '../components/home/GuideAccordion';
import { HeroTripForm } from '../components/home/HeroTripForm';
import { TogetherBand } from '../components/TogetherBand';
import { MascotCard, PageLoading } from '../components/ui';
import { Arrow } from '../components/ui/Arrow';
import { PageLink } from '../components/ui/PageLink';
import { getConnectCards, getEvents, getPageContent, getPlaces, getPosts, getResourceList, getResources, getShareImages } from '../data';
import { asset } from '../lib/asset';
import { directoryEntries, happeningItems, newToThisItems } from '../lib/directoryItems';
import { track } from '../lib/track';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Home (Figma desktop "home v1" 775:3242, mobile 865:5590), built phone-first:
// masthead + trip card → "New to this?" guides → "See what's going on" → Get there together.
// Wording comes from content/pages.json ("home").

export function Home() {
  const data = useContent(async () => {
    const now = new Date();
    const [copy, places, posts, resources, cards, list, shareImages, occurrences] = await Promise.all([
      getPageContent(),
      getPlaces(),
      getPosts(),
      getResources(),
      getConnectCards(),
      getResourceList(),
      getShareImages(),
      getEvents({ from: now, to: new Date(now.getTime() + 120 * 86_400_000) }),
    ]);
    const byId = indexBy(resources);
    // "New to this?" and "See what's going on" are Resources directory items (lib/directoryItems.ts).
    const seen = new Set<string>();
    const events = occurrences.filter((o) => !seen.has(o.event.id) && seen.add(o.event.id));
    const items = directoryEntries({ list, copy: copy.resources, cards, resources, events, posts, shareImages });
    const happening = happeningItems(items, copy.home.discover.featured);
    const guides = newToThisItems(items, copy.home.guides.featured).map(({ pick, item }): GuideItem => {
      const a = item.action;
      const label = pick.linkLabel ?? a?.label ?? '';
      return {
        id: item.id,
        title: pick.title,
        body: pick.body ?? item.description ?? '',
        image: pick.image ?? (item.photo ? { src: item.photo, alt: '' } : undefined),
        link:
          a?.kind === 'out'
            ? { href: a.href, label, provider: item.title, resourceId: a.trackId }
            : { to: a?.to ?? '/resources', label },
      };
    });

    return { copy: copy.home, places, resources: byId, cards, guides, happening, cardBodies: copy.community.together.cardBodies };
  });

  if (!data) return <PageLoading />;
  const { copy } = data;

  return (
    <>
      {/* Civic masthead (desktop 775:3255, phone 865:5598). Desktop: headline and trip
          card on the left, the 451 × 448 picture on the right, bottoms aligned.
          Phones: headline beside a small picture, the trip card under them. */}
      {/* Joy (2026-11-17): shorter than Figma so "New to this?" shows at the bottom of the first screen:
          40px padding (Figma 64), 32px above the trip card (Joy 2026-11-19, was 16), an 80px headline (Figma 96). */}
      <section className="border-b border-navy px-article py-6 lg:border-ink lg:py-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
          <div className="flex min-w-0 flex-col gap-8 lg:flex-1 lg:gap-8">
            <div className="flex items-start gap-1">
              <h1 className="m-0 min-w-0 max-w-[203px] flex-1 text-fluid font-semibold leading-[0.9] tracking-[-0.01em] text-ink [--d:80] [--m:45] lg:max-w-[400px]">
                {copy.hero.title.join(' ')}
              </h1>
              <CapitolIllustration alt={copy.hero.illustrationAlt} className="ml-auto w-[min(138px,40%)] shrink-0 lg:hidden" />
            </div>
            <HeroTripForm
              title={copy.hero.planTitle}
              buttonLabel={copy.hero.button}
              fromPlaceholder="Origin"
              toPlaceholder="Destination"
              places={data.places}
              googleMaps={data.resources.get('google-maps')}
            />
          </div>
          <CapitolIllustration alt={copy.hero.illustrationAlt} className="hidden w-[min(451px,38%)] shrink-0 lg:block" />
        </div>
      </section>

      {/* New to this? We got you. (desktop 775:3274, phone 865:5702). Phones: title,
          guides, card. Desktop: title + 400px card left, guides right, 40 apart. */}
      <section className="px-article pb-10 pt-8 lg:pb-16 lg:pt-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(280px,400px)_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-10 lg:gap-y-6">
          <h2 className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:57] [--m:32] lg:leading-[1.05]">
            {copy.guides.title.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h2>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <GuideAccordion items={data.guides} />
          </div>
          <MascotCard
            title={copy.guides.seeAll.title}
            to={copy.guides.seeAll.to}
            tone="leaf"
            layout="stacked"
            mascot={{ src: '/images/mascots/guides-kangaroo.svg' }}
            hover="fan"
            className="lg:row-start-2"
          />
        </div>
      </section>

      {/* See what's going on in Austin. (desktop 775:3311, phone 865:5749) */}
      <section className="border-y border-ink px-article py-10 lg:py-16">
        <div className="flex flex-col gap-6 lg:gap-10">
          <h2 className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:57] [--m:32] lg:leading-[1.05]">
            {copy.discover.title}
          </h2>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <ul className="m-0 flex list-none flex-col gap-6 p-0 lg:flex-1 lg:gap-8">
              {/* Directory items tagged Happening in Austin (pages.json "featured", or in WordPress the
                  "Show on Home" checkbox). A site opens in a new tab; a guide or event opens its page. */}
              {data.happening.map((item) => {
                const a = item.action;
                const cardClass =
                  'group relative flex h-[200px] items-end justify-between gap-4 overflow-hidden border border-sky bg-sky p-4 lg:h-[218px] lg:border-white';
                const inner = (
                  <>
                    {item.photo && (
                      <img loading="lazy" decoding="async"
                        src={asset(item.photo)}
                        alt=""
                        className="absolute inset-0 size-full object-cover grayscale transition-transform duration-hover group-hover:scale-[1.02]"
                      />
                    )}
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[rgb(0_0_0/0.7)]" />
                    <span className="relative text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-white [--d:28] [--m:24]">{item.title}</span>
                    <Arrow className="relative size-4 shrink-0 text-white" />
                  </>
                );
                return (
                  <li key={item.id}>
                    {a?.kind === 'out' ? (
                      <a
                        href={a.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${item.title}, opens in a new tab`}
                        onClick={() => track('handoff', { resourceId: a.trackId, from: 'home', href: a.href })}
                        className={cardClass}
                      >
                        {inner}
                      </a>
                    ) : (
                      <PageLink to={a?.to ?? '/resources'} className={cardClass}>
                        {inner}
                      </PageLink>
                    )}
                  </li>
                );
              })}
            </ul>
            <MascotCard
              title={copy.discover.explore.title}
              to={copy.discover.explore.to}
              tone="sky"
              layout="side"
              mascot={{ src: '/images/mascots/austin-dog.svg', flip: true }}
              hover="scoot"
              className="lg:w-[41%] lg:shrink-0"
            />
          </div>
        </div>
      </section>

      <TogetherBand
        title={copy.together.title}
        button={copy.together.button}
        cards={data.cards}
        resources={data.resources}
        from="home"
        variant="home"
        bodies={data.cardBodies}
      />
    </>
  );
}
