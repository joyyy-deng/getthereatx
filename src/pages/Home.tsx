import { Fragment } from 'react';
import { CapitolIllustration } from '../components/home/CapitolIllustration';
import { GuideAccordion, type GuideItem } from '../components/home/GuideAccordion';
import { HeroTripForm } from '../components/home/HeroTripForm';
import { TogetherBand } from '../components/TogetherBand';
import { MascotCard, PageLoading } from '../components/ui';
import { PageLink } from '../components/ui/PageLink';
import { getConnectCards, getPageContent, getPlaces, getPosts, getResources } from '../data';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Home (Figma desktop 787:6463, mobile 865:5590), built phone-first:
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
            link: {
              href: post.url,
              label: item.linkLabel ?? 'Read the guide',
              provider: 'GetThereATX',
              resourceId: `post:${post.id}`,
            },
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
    return { copy: copy.home, places, resources: byId, cards, guides };
  });

  if (!data) return <PageLoading />;
  const { copy } = data;

  return (
    <>
      {/* Civic masthead */}
      <section className="border-b border-navy px-6 py-8 lg:p-16">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:gap-10">
          <div className="flex flex-col gap-6 lg:w-[712px] lg:shrink lg:justify-end">
            <h1 className="m-0 text-[61px] font-bold leading-[0.98] tracking-[-0.04em] text-ink sm:text-[96px] xl:text-[124px]">
              {copy.hero.title.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h1>
            <HeroTripForm
              title={copy.hero.planTitle}
              buttonLabel={copy.hero.button}
              fromPlaceholder="Origin"
              toPlaceholder="Destination"
              places={data.places}
              googleMaps={data.resources.get('google-maps')}
            />
          </div>
          <CapitolIllustration
            alt={copy.hero.illustrationAlt}
            className="w-full max-w-[560px] self-center lg:w-[560px] lg:shrink-0 lg:self-end"
          />
        </div>
      </section>

      {/* New to this? We got you. Phones: title, guides, card. Desktop: title + card left, guides right. */}
      <section className="px-6 py-10 lg:p-16">
        <div className="grid gap-6 lg:grid-cols-[369px_1fr] lg:grid-rows-[auto_1fr] lg:gap-x-24 lg:gap-y-6">
          <h2 className="m-0 text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink lg:text-[64px] lg:leading-[0.98] lg:tracking-[-0.04em]">
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

      {/* See what's going on in Austin. */}
      <section className="border-y border-rule px-6 py-10 lg:p-16">
        <div className="flex flex-col gap-6 lg:gap-10">
          <h2 className="m-0 text-[40px] font-semibold leading-[1.08] tracking-[-0.03em] text-ink lg:text-[80px] lg:leading-[0.98] lg:tracking-[-0.04em]">
            {copy.discover.title}
          </h2>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            <ul className="m-0 flex list-none flex-col gap-6 p-0 lg:flex-1 lg:gap-8">
              {copy.discover.cards.map((c) => (
                <li key={c.title}>
                  <PageLink
                    to={c.to}
                    className="group relative flex h-[200px] items-end justify-between overflow-hidden border border-sky p-4 lg:h-[218px]"
                  >
                    <img
                      src={asset(c.image.src)}
                      alt={c.image.alt}
                      className="absolute inset-0 size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                    />
                    <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-45% to-[rgb(0_0_0/0.7)]" />
                    <span className="relative text-[28px] font-bold tracking-[-0.04em] text-white">{c.title}</span>
                    <span aria-hidden="true" className="relative text-[20px] text-white">
                      →
                    </span>
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
              className="lg:w-[484px] lg:shrink-0"
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
      />
    </>
  );
}
