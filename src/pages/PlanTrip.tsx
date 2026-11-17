import { useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ModeCard } from '../components/plan/ModeCard';
import { PlaceCombobox } from '../components/plan/PlaceCombobox';
import { TripMap } from '../components/plan/TripMap';
import { LinkOut, PageLoading } from '../components/ui';
import { FilterSelect } from '../components/ui/FilterSelect';
import type { Place } from '../content/schema';
import { getBusRoutes, getPageContent, getPlaces, getPlanConfig, getResources } from '../data';
import { asset } from '../lib/asset';
import { departureOptions, departureTime, formatTime } from '../lib/departure';
import { text } from '../lib/i18n';
import { indexBy } from '../lib/indexBy';
import { cardKey, handoffUrl, isAirportTrip, planCards, routeMiles, typicalMinutes } from '../lib/trip';
import { useContent } from '../lib/useContent';

// Plan Your Trip (Figma desktop 775:3820 "V3", mobile 865:5838), built phone-first:
// From / To → compare cards → the picked card's route detail, map and hand-off.
// The whole trip lives in the URL: /plan?from=downtown&to=mueller&mode=bike&leave=08:15
// so refreshing or sharing the link restores the same screen.

export function PlanTrip() {
  const data = useContent(async () => {
    const [copy, places, config, resources, busRoutes] = await Promise.all([
      getPageContent(),
      getPlaces(),
      getPlanConfig(),
      getResources(),
      getBusRoutes(),
    ]);
    return { copy: copy.plan, places, modes: config.modes, resources: indexBy(resources), busRoutes };
  });
  const [params, setParams] = useSearchParams();
  const compareRef = useRef<HTMLHeadingElement>(null);

  const placeById = (id: string | null) => (id ? data?.places.find((p) => p.id === id) : undefined);
  const from = placeById(params.get('from'));
  const toRaw = placeById(params.get('to'));
  const to = toRaw?.id === from?.id ? undefined : toRaw;

  // Departure menu, built once per visit: "Leave now", then every 15 minutes.
  const leaveOptions = useMemo(() => departureOptions(), []);
  const leave = params.get('leave') ?? '';

  function update(next: { from?: Place | null; to?: Place | null; mode?: string; leave?: string }) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        const set = (key: string, value: string | undefined) => (value ? p.set(key, value) : p.delete(key));
        if (next.from !== undefined) set('from', next.from?.id);
        if (next.to !== undefined) set('to', next.to?.id);
        if (next.mode !== undefined) set('mode', next.mode);
        if (next.leave !== undefined) set('leave', next.leave);
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
  // CapMetro route(s) for this trip, shown on the bus cards and in the route detail.
  const bus = trip ? data.busRoutes(trip.from.id, trip.to.id) : { legs: [], ut: [] };
  const busLegs = bus.legs;
  const busRoute = busLegs.length ? copy.busRoute.replace('{routes}', busLegs.map((r) => r.number).join(' → ')) : undefined;
  const utShuttle = bus.ut.length ? copy.utShuttleShort.replace('{routes}', bus.ut[0]!.number) : undefined;
  /** CapMetro's name minus its leading number: "7-Duval / Dove Springs" → "Duval / Dove Springs". */
  const routeName = (r: { number: string; name: string }) => r.name.replace(new RegExp(`^${r.number}[\\s-]*`), '');
  // The picked card (?mode=), or the first one.
  const picked = cards.find((c) => cardKey(c.mode) === params.get('mode')) ?? cards[0];
  const minutes = picked ? typicalMinutes(picked.minutes) : 0;
  const leaveAt = departureTime(leave || null);
  const arriveAt = new Date(leaveAt.getTime() + minutes * 60_000);
  const timing = copy.timing
    .replace('{leave}', leave ? formatTime(leaveAt) : 'now')
    .replace('{arrive}', formatTime(arriveAt));

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
      chevron={false}
      compact
      className="min-w-0 flex-1"
    />
  );

  return (
    // Desktop: fills the screen under the 72px nav (Joy, 2026-11-17); the map takes what's left, at least 420px tall.
    // Phones scroll (four cards and a map don't fit on a phone screen).
    <div className="flex flex-col gap-7 px-page py-6 lg:min-h-[calc(100dvh-72px)] lg:gap-4 lg:py-5">
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
            label={copy.leaveLabel}
            value={leave}
            onChange={(v) => update({ leave: v })}
            options={[
              { value: '', label: copy.leaveNow },
              // A shared link with a time that isn't in today's list still shows it.
              ...(leave && !leaveOptions.some((o) => o.value === leave)
                ? [{ value: leave, label: formatTime(departureTime(leave)) }]
                : []),
              ...leaveOptions,
            ]}
            className="min-w-0 flex-1 lg:hidden"
          />
          {/* Desktop (Figma 775:3820): "Transport type" in place of the departure time; it picks a card. */}
          <FilterSelect
            label={copy.transportLabel}
            value={picked && params.get('mode') ? cardKey(picked.mode) : ''}
            onChange={(v) => update({ mode: v })}
            options={[{ value: '', label: copy.transportLabel }, ...cards.map((c) => ({ value: cardKey(c.mode), label: text(c.mode.title) }))]}
            className="hidden lg:flex lg:h-[52px] lg:w-[180px] lg:flex-none"
          />
          <button
            type="submit"
            disabled={!trip}
            className="flex min-h-[48px] items-center gap-2 bg-charcoal px-4 text-[11px] font-normal leading-[16px] tracking-[0.01em] text-white transition-opacity duration-hover hover:opacity-90 disabled:opacity-50 lg:h-[52px] lg:bg-leaf lg:px-6 lg:text-[14px] lg:font-semibold lg:leading-[20px] lg:text-ink"
          >
            {/* Figma: "Update trip ↓" on phones, "Go" on desktop. */}
            <span className="lg:hidden">{copy.updateButton}</span>
            <span className="hidden lg:inline">{copy.goButton}</span>
          </button>
        </div>
      </form>

      {!trip && (
        <>
          <p className="m-0 text-copy text-ink-soft">{copy.emptyHint}</p>
          <div className="h-[420px] lg:h-auto lg:min-h-0 lg:flex-1">
            <TripMap places={data.places} from={from} to={to} onPick={pickOnMap} />
          </div>
        </>
      )}

      {trip && picked && (
        <>
          {/* Compare ways to get there */}
          <section aria-labelledby="compare-title" className="flex flex-col gap-3">
            <h2
              id="compare-title"
              ref={compareRef}
              tabIndex={-1}
              className="m-0 scroll-mt-[112px] text-title font-semibold text-ink outline-none lg:text-[28px]"
            >
              {copy.compareTitle}
            </h2>
            <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:auto-cols-fr lg:grid-flow-col lg:gap-4">
              {cards.map((c) => (
                <li key={cardKey(c.mode)}>
                  <ModeCard
                    card={c}
                    miles={miles}
                    selected={c === picked}
                    route={c.mode.id === 'bus' ? busRoute : undefined}
                    utShuttle={c.mode.id === 'bus' ? utShuttle : undefined}
                    onSelect={() => update({ mode: cardKey(c.mode) })}
                  />
                </li>
              ))}
            </ul>
          </section>

          {/* Selected route detail. Phones: text, map, steps, button. Desktop: text column + map. */}
          <section
            aria-labelledby="route-title"
            className="grid gap-5 lg:min-h-[420px] lg:flex-1 lg:grid-cols-[minmax(300px,34%)_1fr] lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:gap-y-3"
          >
            <div className="flex flex-col gap-4 lg:gap-2">
              <p className="m-0 text-caption font-semibold uppercase text-charcoal">
                {text(picked.mode.title)}
              </p>
              <h2
                id="route-title"
                className="m-0 text-heading font-normal text-ink"
              >
                {copy.headline.replace('{minutes}', String(minutes)).replace('{to}', text(trip.to.name))}
              </h2>
              <p className="m-0 text-copy text-ink-soft">
                {/* The trip's distance (Joy, 2026-11-17: instead of the mode's effort line). */}
                {miles.toFixed(1)} miles
              </p>
              <p className="m-0 text-fine font-medium text-ink lg:hidden">{timing}</p>
            </div>
            <div className="h-[300px] lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:h-auto lg:min-h-0">
              <TripMap
                places={data.places}
                from={from}
                to={to}
                badge={`${minutes} min`}
                onPick={pickOnMap}
              />
            </div>
            {/* Figma: A, a line down to B, B. */}
            <ol className="m-0 flex list-none flex-col p-0 text-lead text-ink">
              <li className="flex gap-4">
                <span aria-hidden="true" className="w-3 text-fine">A</span>
                <span className="sr-only">From </span>
                {text(trip.from.name)}
              </li>
              {picked.mode.id === 'bus' && (busLegs.length > 0 || bus.ut.length > 0) ? (
                <li className="flex gap-4">
                  <span aria-hidden="true" className="ml-[5px] w-px shrink-0 self-stretch bg-ink" />
                  <span className="sr-only">By bus: </span>
                  <span className="ml-[3px] flex flex-col gap-1 py-2 text-copy text-ink-soft">
                    {busLegs.map((r) => (
                      <span key={r.number}>
                        <strong className="font-semibold text-ink">{copy.busRoute.replace('{routes}', r.number)}</strong>
                        {' · '}
                        {routeName(r)}
                      </span>
                    ))}
                    {bus.ut.map((r) => (
                      <span key={`ut-${r.number}`}>
                        <strong className="font-semibold text-ink">{copy.utShuttle.replace('{routes}', r.number)}</strong>
                        {' · '}
                        {routeName(r)}
                      </span>
                    ))}
                  </span>
                </li>
              ) : (
                <li aria-hidden="true" className="ml-[5px] h-6 w-px bg-ink" />
              )}
              <li className="flex gap-4">
                <span aria-hidden="true" className="w-3 text-fine">B</span>
                <span className="sr-only">To </span>
                {text(trip.to.name)}
              </li>
            </ol>
            <HandoffButton picked={picked} trip={{ ...trip, leaveAt: leave ? leaveAt : undefined }} resources={data.resources} />
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
  trip: { from: Place; to: Place; leaveAt?: Date };
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
    <div>
      <LinkOut
        as="button"
        href={handoffUrl(r, trip, link.travelmode)}
        provider={r.provider}
        label={text(link.label)}
        resourceId={r.id}
        from="plan"
        mode={mode.id}
        className="flex min-h-[56px] w-full items-center justify-between !rounded-none !border-charcoal !bg-charcoal px-5 text-fine !text-white hover:opacity-90 lg:min-h-[48px] lg:!border-leaf lg:!bg-leaf lg:font-semibold lg:!text-ink"
      />
    </div>
  );
}
