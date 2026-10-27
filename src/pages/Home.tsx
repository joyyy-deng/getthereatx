import { Fragment } from 'react';
import { ConnectCards } from '../components/ConnectCards';
import { HeroTripForm } from '../components/home/HeroTripForm';
import { LinkOut, PageLoading, SectionHeader } from '../components/ui';
import { getConnectCards, getPageContent, getPlaces, getPosts, getResources } from '../data';
import { asset } from '../lib/asset';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';

// Home (Figma 317:387): hero trip form → Build confidence → Try something new.
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
    return {
      copy: copy.home,
      places,
      posts: new Map(posts.map((p) => [p.slug, p])),
      resources: indexBy(resources),
      cards,
    };
  });

  if (!data) return <PageLoading />;
  const { copy, places, posts, resources, cards } = data;

  return (
    <>
      {/* Hero */}
      <section
        aria-labelledby="home-title"
        className="relative z-10 min-h-[686px] px-6 md:h-[675px] md:min-h-0 md:px-8"
      >
        <img
          src={asset('/images/home/hero.jpg')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[center_60%]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.5)]" />
        <div className="relative mx-auto flex h-full min-h-[686px] max-w-content flex-col justify-end gap-4 pb-16 pt-16 md:min-h-0 md:pb-24 md:pt-0">
          <h1 id="home-title" className="m-0 text-h1 text-white md:text-display">
            {copy.hero.title.map((line, i) => (
              <Fragment key={i}>
                {i > 0 && (
                  <>
                    {' '}
                    <br className="hidden md:block" />
                  </>
                )}
                {line}
              </Fragment>
            ))}
          </h1>
          <p className="m-0 max-w-[460px] text-body text-white">{copy.hero.intro}</p>
          <HeroTripForm places={places} googleMaps={resources.get('google-maps')} buttonLabel={copy.hero.button} />
        </div>
      </section>

      {/* Build confidence */}
      <section className="px-6 pt-16 md:px-8 md:pt-24">
        <div className="mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader size="display" eyebrow={copy.confidence.eyebrow} title={copy.confidence.title} />
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {copy.confidence.rows.map((row) => {
              const post = posts.get(row.postSlug);
              if (!post) return null;
              return (
                <li key={row.postSlug}>
                  <LinkOut
                    as="row"
                    href={post.url}
                    provider="GetThereATX"
                    label={row.label}
                    resourceId={`post:${post.id}`}
                    from="home"
                  />
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Connect */}
      <section className="px-6 py-16 md:px-8 md:py-24">
        <div className="mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader
            size="display"
            eyebrow={copy.connect.eyebrow}
            title={copy.connect.title}
            aside={copy.connect.intro}
          />
          <ConnectCards cards={cards} resources={resources} from="home" />
        </div>
      </section>
    </>
  );
}
