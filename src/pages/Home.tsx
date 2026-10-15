import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlaceCombobox } from '../components/plan/PlaceCombobox';
import { ConnectCards } from '../components/ConnectCards';
import { Chip, LinkOut, SectionHeader } from '../components/ui';
import type { ConnectCard, HomeContent, Place, Post, Resource } from '../content/schema';
import { getConnectCards, getHomeContent, getPlaces, getPosts, getResources } from '../data';
import { cx } from '../lib/cx';
import { text } from '../lib/i18n';
import { asset } from '../lib/asset';

// Home (Figma 317:387): hero trip form → Build confidence → Try something new.

interface Data {
  home: HomeContent;
  places: Place[];
  posts: Map<string, Post>;
  resources: Map<string, Resource>;
  cards: ConnectCard[];
}

export function Home() {
  const [data, setData] = useState<Data>();
  const [from, setFrom] = useState<Place>();
  const [to, setTo] = useState<Place>();
  /** Which field a tag click fills (same idea as map clicks on Plan Your Trip). */
  const [field, setField] = useState<'from' | 'to'>('from');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([getHomeContent(), getPlaces(), getPosts(), getResources(), getConnectCards()]).then(
      ([home, places, posts, resources, cards]) =>
        setData({
          home,
          places,
          posts: new Map(posts.map((p) => [p.slug, p])),
          resources: new Map(resources.map((r) => [r.id, r])),
          cards,
        }),
    );
  }, []);

  function planTrip() {
    const p = new URLSearchParams();
    if (from) p.set('from', from.id);
    if (to) p.set('to', to.id);
    const qs = p.toString();
    navigate(qs ? `/plan?${qs}` : '/plan');
  }

  if (!data) return <div className="min-h-screen" aria-busy="true" />;

  const googleMaps = data.resources.get('google-maps');
  const quickPicks = data.home.heroDestinations
    .map((id) => data.places.find((p) => p.id === id))
    .filter((p): p is Place => !!p);

  return (
    <>
      {/* Hero */}
      <section aria-labelledby="home-title" className="relative z-10 h-[675px] px-8">
        <img
          src={asset('/images/home/hero.jpg')}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full object-cover object-[center_60%]"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-[rgb(0_0_0/0.5)]" />
        <div className="relative mx-auto flex h-full max-w-content flex-col justify-end gap-4 pb-24">
          <h1 id="home-title" className="m-0 text-display text-white">
            You know where you’re going.
            <br />
            Get there with us.
          </h1>
          <p className="m-0 max-w-[460px] text-body text-white">
            GetThereATX is your one-stop shop for Austin transportation information. Learn about modes of transport
            available to you and ways to save time and money on your commute.
          </p>
          <form
            className="flex flex-col gap-4 pt-[20px]"
            onSubmit={(e) => {
              e.preventDefault();
              planTrip();
            }}
          >
            <div className="flex gap-4">
              <PlaceCombobox
                label="From"
                placeholder={field === 'from' ? 'Pick a tag or type' : 'Enter starting point'}
                selected={field === 'from'}
                onActivate={() => setField('from')}
                places={data.places}
                value={from}
                other={to}
                otherNote="Your destination"
                side="from"
                googleMaps={googleMaps}
                onChange={(p) => {
                  setFrom(p);
                  if (p && !to) setField('to');
                }}
                tone="light"
                className="w-[240px]"
              />
              <PlaceCombobox
                label="To"
                placeholder={field === 'to' ? 'Pick a tag or type' : 'Enter destination'}
                selected={field === 'to'}
                onActivate={() => setField('to')}
                places={data.places}
                value={to}
                other={from}
                otherNote="Your starting point"
                side="to"
                googleMaps={googleMaps}
                onChange={setTo}
                tone="light"
                className="w-[240px]"
              />
            </div>
            <div role="group" aria-label="Popular destinations" className="flex flex-wrap items-center gap-2">
              {quickPicks.map((p) => {
                const selected = from?.id === p.id || to?.id === p.id;
                // A tag fills the selected field. Clicking the tag already in that
                // field clears it; a place can't be in both fields at once.
                function pick() {
                  const [current, set, otherValue, setOther] =
                    field === 'from' ? [from, setFrom, to, setTo] : [to, setTo, from, setFrom];
                  if (current?.id === p.id) {
                    set(undefined);
                    return;
                  }
                  if (otherValue?.id === p.id) setOther(undefined);
                  set(p);
                  if (field === 'from' && (!to || to.id === p.id)) setField('to');
                }
                return (
                  <Chip
                    key={p.id}
                    label={text(p.name)}
                    selected={selected}
                    onClick={pick}
                    className={cx(
                      '!min-h-[36px] !border-white !px-4 !py-1 !text-small',
                      selected ? '!bg-white !text-ink' : '!bg-transparent !text-white hover:!bg-white/10',
                    )}
                  />
                );
              })}
            </div>
            <div className="pt-2">
              <button
                type="submit"
                className="rounded-sm bg-brand-navy px-8 py-3 text-label uppercase text-white transition-opacity duration-hover hover:opacity-90"
              >
                Plan your trip →
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Build confidence */}
      <section className="px-8 pt-24">
        <div className="mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader size="display" eyebrow="Learn" title="Build confidence before you go" />
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {data.home.confidenceRows.map((row) => {
              const post = data.posts.get(row.postSlug);
              if (!post) return null;
              return (
                <li key={row.postSlug}>
                  <LinkOut
                    as="row"
                    href={post.url}
                    provider="GetThereATX"
                    label={text(row.label)}
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
      <section className="px-8 py-24">
        <div className="mx-auto flex max-w-content flex-col gap-12">
          <SectionHeader
            size="display"
            eyebrow="Connect"
            title="Try something new with other people."
            aside="Local events and programs can make unfamiliar transportation options feel more comfortable. These are good places to connect with the Austin community and try out a route."
          />
          <ConnectCards cards={data.cards} resources={data.resources} from="home" />
        </div>
      </section>
    </>
  );
}
