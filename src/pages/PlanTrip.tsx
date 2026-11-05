import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ModeCard } from '../components/plan/ModeCard';
import { PlaceCombobox } from '../components/plan/PlaceCombobox';
import { TripMap } from '../components/plan/TripMap';
import { LinkOut, PageLoading } from '../components/ui';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { Place } from '../content/schema';
import { getPageContent, getPlaces, getPlanConfig, getResources } from '../data';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { indexBy } from '../lib/indexBy';
import { handoffUrl, isAirportTrip, planCards, routeMiles, typicalMinutes } from '../lib/trip';
import { useContent } from '../lib/useContent';

// Plan Your Trip (Figma desktop 775:3820 "V3", mobile 865:5838), built phone-first:
// From / To → compare cards → the picked card's route detail, map and hand-off.
// The whole trip lives in the URL: /plan?from=downtown&to=mueller&mode=bike
// so refreshing or sharing the link restores the same screen.

export function PlanTrip() {
  const data = useContent(async () => {
    const [copy, places, config, resources] = await Promise.all([
      getPageContent(),
      getPlaces(),
      getPlanConfig(),
      getResources(),
    ]);
    return { copy: copy.plan, places, modes: config.modes, resources: indexBy(resources) };
  });
  const [params, setParams] = useSearchParams();
  const [depart, setDepart] = useState('');
  const compareRef = useRef<HTMLHeadingElement>(null);

  const placeById = (id: string | null) => (id ? data?.places.find((p) => p.id === id) : undefined);
  const from = placeById(params.get('from'));
  const toRaw = placeById(params.get('to'));
  const to = toRaw?.id === from?.id ? undefined : toRaw;

  function update(next: { from?: Place | null; to?: Place | null; mode?: string }) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        const set = (key: string, value: string | undefined) => (value ? p.set(key, value) : p.delete(key));
        if (next.from !== undefined) set('from', next.from?.id);
        if (next.to !== undefined) set('to', next.to?.id);
        if (next.mode !== undefined) set('mode', next.mode);
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  /** Map clicks fill From first, then To. */
  function pickOnMap(place: Place) {
    if (!from) update({ from: place });
    else if (place.id !== from.id) update({ to: place });
  }

  if (!data) return <PageLoading />;
  const { copy } = data;
  const trip = from && to ? { from, to } : undefined;
  const cards = trip ? planCards(data.modes, trip.from, trip.to, []) : [];
  const miles = trip ? routeMiles(trip.from, trip.to) : 0;
  // The picked card (?mode=), or the first one.
  const picked = cards.find((c) => c.mode.id === params.get('mode')) ?? cards[0];
  const minutes = picked ? typicalMinutes(picked.minutes) : 0;

  const swap = (
    <button
      type="button"
      onClick={() => update({ from: to ?? null, to: from ?? null })}
      disabled={!from && !to}
      aria-label="Swap From and To"
      className="grid size-8 shrink-0 place-items-center border border-line bg-bg transition-colors duration-hover hover:bg-mist disabled:opacity-40"
    >
      <img src={asset('/icons/arrow-left-right.svg')} alt="" width={16} height={16} className="block size-4" />
    </button>
  );

  const field = (side: 'from' | 'to') => (
    <PlaceCombobox
      label={side === 'from' ? 'From' : 'To'}
      placeholder={side === 'from' ? copy.fromPlaceholder : copy.toPlaceholder}
      places={data.places}
      value={side === 'from' ? from : to}
      other={side === 'from' ? to : from}
      otherNote={side === 'from' ? 'Your destination' : 'Your starting point'}
      side={side}
      googleMaps={data.resources.get('google-maps')}
      onChange={(p) => update({ [side]: p ?? null })}
      className="min-w-0 flex-1"
    />
  );

  return (
    <div className="flex flex-col gap-7 p-6 lg:gap-6 lg:p-16">
      <h1 className="sr-only">{copy.title}</h1>

      {/* Search recap: stacked on phones, one row on desktop. */}
      <form
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          compareRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          compareRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className="flex flex-col gap-3 lg:flex-1 lg:flex-row lg:items-center">
          {field('from')}
          {/* Phones: swap sits beside To. Desktop: between the two fields. */}
          <div className="hidden lg:block">{swap}</div>
          <div className="flex items-center gap-3 lg:contents">
            {field('to')}
            <div className="lg:hidden">{swap}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 lg:gap-6">
          <FilterSelect
            label="When"
            value={depart}
            onChange={setDepart}
            options={copy.departOptions.map((o, i) => ({ value: i ? o : '', label: o }))}
            className="min-w-0 flex-1 lg:h-[62px] lg:w-[160px] lg:flex-none"
          />
          <button
            type="submit"
            disabled={!trip}
            className="flex min-h-[56px] items-center gap-2 bg-charcoal px-4 text-[14px] font-medium text-white transition-opacity duration-hover hover:opacity-90 disabled:opacity-50 lg:h-[62px] lg:px-6 lg:font-bold"
          >
            {copy.updateButton}
            <span aria-hidden="true" className="text-[20px] font-normal">
              ↓
            </span>
          </button>
        </div>
      </form>

      {!trip && (
        <>
          <p className="m-0 text-[16px] leading-[1.5] text-ink-soft">{copy.emptyHint}</p>
          <div className="h-[420px] lg:h-[560px]">
            <TripMap places={data.places} from={from} to={to} onPick={pickOnMap} note={copy.mapNote} />
          </div>
        </>
      )}

      {trip && picked && (
        <>
          {/* Compare ways to get there */}
          <section aria-labelledby="compare-title" className="flex flex-col gap-3 lg:gap-4">
            <h2
              id="compare-title"
              ref={compareRef}
              tabIndex={-1}
              className="m-0 scroll-mt-[112px] text-[28px] font-medium leading-[1.08] tracking-[-0.03em] text-ink outline-none lg:text-[26px] lg:leading-[1.3] lg:tracking-[-0.04em]"
            >
              {copy.compareTitle}
            </h2>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:gap-4">
              {cards.map((c) => (
                <li key={c.mode.id}>
                  <ModeCard
                    card={c}
                    miles={miles}
                    selected={c === picked}
                    onSelect={() => update({ mode: c.mode.id })}
                  />
                </li>
              ))}
            </ul>
            <p className="m-0 text-[12px] leading-[1.5] text-ink-muted">{copy.estimateNote}</p>
          </section>

          {/* Selected route detail. Phones: text, map, steps, button. Desktop: text column + map. */}
          <section
            aria-labelledby="route-title"
            className="grid gap-5 lg:grid-cols-[416px_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8"
          >
            <div className="flex flex-col gap-4 lg:pt-2">
              <p className="m-0 text-[12px] font-bold uppercase leading-[1.3] text-charcoal">
                {text(picked.mode.title)} · {copy.selectedLabel}
              </p>
              <h2
                id="route-title"
                className="m-0 text-[32px] font-medium leading-[1.08] tracking-[-0.03em] text-ink lg:leading-[1.3] lg:tracking-[-0.04em]"
              >
                {copy.headline.replace('{minutes}', String(minutes)).replace('{to}', text(trip.to.name))}
              </h2>
              <p className="m-0 text-[14px] leading-[1.5] text-ink-soft lg:leading-[1.3]">
                {text(picked.mode.eyebrow)}. {text(picked.mode.effort)}.
              </p>
            </div>
            <div className="h-[300px] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-[386px]">
              <TripMap
                places={data.places}
                from={from}
                to={to}
                badge={`${minutes} min`}
                onPick={pickOnMap}
                note={copy.mapNote}
              />
            </div>
            <ol className="m-0 flex list-none flex-col gap-3 p-0 text-[14px] leading-[1.5] text-ink">
              <li className="flex gap-4">
                <span aria-hidden="true">A</span>
                <span className="sr-only">From </span>
                {text(trip.from.name)}
              </li>
              <li className="flex gap-4">
                <span aria-hidden="true">B</span>
                <span className="sr-only">To </span>
                {text(trip.to.name)}
              </li>
            </ol>
            <HandoffButton picked={picked} trip={trip} resources={data.resources} />
          </section>
        </>
      )}
    </div>
  );
}

/** The picked mode's main hand-off (Google Maps, CapMetro, DriveTexas…), from the registry. */
function HandoffButton({
  picked,
  trip,
  resources,
}: {
  picked: NonNullable<ReturnType<typeof planCards>[number]>;
  trip: { from: Place; to: Place };
  resources: Map<string, import('../content/schema').Resource>;
}) {
  const { mode } = picked;
  const link =
    picked.longRide && mode.longRide
      ? mode.longRide
      : isAirportTrip(trip.from, trip.to) && mode.airportPrimary
        ? mode.airportPrimary
        : mode.primary;
  const r = resources.get(link.resourceId);
  if (!r) return null;
  return (
    <div className="lg:self-start">
      <LinkOut
        as="button"
        href={handoffUrl(r, trip, link.travelmode)}
        provider={r.provider}
        label={text(link.label)}
        resourceId={r.id}
        from="plan"
        mode={mode.id}
        className="flex min-h-[56px] w-full items-center justify-center !rounded-none !border-charcoal !bg-charcoal px-4 text-[14px] font-medium !text-white hover:opacity-90 lg:min-h-[48px] lg:text-[16px] lg:font-bold"
      />
    </div>
  );
}
