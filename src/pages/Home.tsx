import { Fragment } from 'react';
import { CapitolIllustration } from '../components/home/CapitolIllustration';
import { GuideAccordion, type GuideItem } from '../components/home/GuideAccordion';
import { HeroTripForm } from '../components/home/HeroTripForm';
import { TogetherBand } from '../components/TogetherBand';
import { MascotCard, PageLoading } from '../components/ui';
import { Arrow } from '../components/ui/Arrow';
import { PageLink } from '../components/ui/PageLink';
import { getConnectCards, getPageContent, getPlaces, getPosts, getResources } from '../data';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Home (Figma desktop "home v1" 775:3242, mobile 865:5590), built phone-first:
// masthead + trip card → "New to this?" guides → "See what's going on" → Get there together.
// Wording comes from content/pages.json ("home").

export function Home() {
  const data = useContent(async () => {
    const [copy, places, posts, resources, cards] = await Promise.all([
      getPageContent(),
      getPlaces(),
      getPosts(),
      getResources(),
      getConnectCards(),
    ]);
    const postsBySlug = new Map(posts.map((p) => [p.slug, p]));
    const byId = indexBy(resources);
    // Each accordion row reads its photo, line and link from a post or a registry resource.
    const guides = copy.home.guides.items.flatMap((item): GuideItem[] => {
      const post = item.postSlug ? postsBySlug.get(item.postSlug) : undefined;
      const r = item.resourceId ? byId.get(item.resourceId) : undefined;
      if (post)
        return [
          {
            id: item.id,
            title: item.title,
            body: item.body ?? text(post.summary),
            image: item.image ?? post.image,
            // The guide page in the new design (both templates live there).
            link: { to: `/guides/${post.slug}`, label: item.linkLabel ?? 'Read the guide' },
          },
        ];
      if (r)
        return [
          {
            id: item.id,
            title: item.title,
            body: item.body ?? r.oneLiner,
            image: item.image,
            link: { href: r.url, label: item.linkLabel ?? r.action, provider: r.provider, resourceId: r.id },
          },
        ];
      return [];
    });
    return { copy: copy.home, places, resources: byId, cards, guides, cardBodies: copy.community.together.cardBodies };
  });

  if (!data) return <PageLoading />;
  const { copy } = data;

  return (
    <>
      {/* Civic masthead (desktop 775:3255, phone 865:5598). Desktop: headline and trip
          card on the left, the 451 × 448 picture on the right, bottoms aligned.
          Phones: headline beside a small picture, the trip card under them. */}
      <section className="border-b border-navy px-article py-8 lg:border-ink lg:py-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:gap-10">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-1">
            <div className="flex items-start gap-1">
              <h1 className="m-0 min-w-0 max-w-[203px] flex-1 text-fluid font-semibold leading-[1.05] tracking-[-0.01em] text-ink [--d:96] [--m:45] lg:max-w-[489px]">
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
      <section className="px-article py-10 lg:py-16">
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
              {copy.discover.cards.map((c) => (
                <li key={c.title}>
                  <PageLink
                    to={c.to}
                    className="group relative flex h-[200px] items-end justify-between overflow-hidden border border-sky p-4 lg:h-[218px] lg:border-white"
                  >
                    <img loading="lazy" decoding="async"
                      src={asset(c.image.src)}
                      alt={c.image.alt}
                      className="absolute inset-0 size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[rgb(0_0_0/0.7)]" />
                    <span className="relative text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-white [--d:28] [--m:24]">{c.title}</span>
                    <Arrow className="relative size-4 text-white" strokeWidth={2.5} />
                  </PageLink>
                </li>
              ))}
            </ul>
            <MascotCard
              title={copy.discover.explore.title}
              to={copy.discover.explore.to}
              tone="sky"
              layout="side"
              mascot={{ src: '/images/mascots/austin-dog.svg', flip: true }}
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
