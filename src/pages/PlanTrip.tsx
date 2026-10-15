import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ModeCard } from '../components/plan/ModeCard';
import { PlaceCombobox } from '../components/plan/PlaceCombobox';
import { TripMap } from '../components/plan/TripMap';
import { Chip, LinkOut } from '../components/ui';
import type { Place, PlanMode, PlanPreference, Program, Resource } from '../content/schema';
import { getPlaces, getPlanConfig, getPrograms, getResources } from '../data';
import { text } from '../lib/i18n';
import { isAirportTrip, isStudentTrip, planCards, routeMiles } from '../lib/trip';

// Plan Your Trip (Figma 327:969 → 379:3037 → 407:3588).
// The whole trip lives in the URL: /plan?from=downtown&to=mueller&pref=cost
// so refreshing or sharing the link restores the same screen.

// Narrower than the Figma frame's 588px panel (about 80%), so more of the map shows.
const PANEL_W = 480;
const FORM_PAD: [number, number] = [330, 60];
/** The page fills the screen under the nav (75px), with no page scroll. */
const SECTION_H = 'h-[calc(100dvh-75px)] min-h-[560px]';

interface Data {
  places: Place[];
  modes: PlanMode[];
  prefs: PlanPreference[];
  resources: Map<string, Resource>;
  programs: Map<string, Program>;
}

export function PlanTrip() {
  const [data, setData] = useState<Data>();
  const [params, setParams] = useSearchParams();
  /** Which field a map click fills. */
  const [field, setField] = useState<'from' | 'to'>(params.get('from') ? 'to' : 'from');

  useEffect(() => {
    Promise.all([getPlaces(), getPlanConfig(), getResources(), getPrograms()]).then(
      ([places, config, resources, programs]) =>
        setData({
          places,
          modes: config.modes,
          prefs: config.preferences,
          resources: new Map(resources.map((r) => [r.id, r])),
          programs: new Map(programs.map((p) => [p.id, p])),
        }),
    );
  }, []);

  const byId = (id: string | null) => (id ? data?.places.find((p) => p.id === id) : undefined);
  const from = byId(params.get('from'));
  const toRaw = byId(params.get('to'));
  const to = toRaw?.id === from?.id ? undefined : toRaw;
  const prefIds = (params.get('pref') ?? '').split(',').filter(Boolean);
  const selectedPrefs = data?.prefs.filter((p) => prefIds.includes(p.id)) ?? [];

  function update(next: { from?: Place | null; to?: Place | null; pref?: string[] }) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        const set = (key: string, value: string | undefined) => (value ? p.set(key, value) : p.delete(key));
        if (next.from !== undefined) set('from', next.from?.id);
        if (next.to !== undefined) set('to', next.to?.id);
        if (next.pref !== undefined) set('pref', next.pref.join(','));
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  /** Map click fills the selected field. After From is set, To is selected next. */
  function pickOnMap(place: Place) {
    if (field === 'from') {
      if (place.id === from?.id) return;
      const clearsTo = place.id === to?.id;
      update({ from: place, ...(clearsTo ? { to: null } : {}) });
      if (!to || clearsTo) setField('to');
    } else {
      if (place.id === from?.id || place.id === to?.id) return;
      update({ to: place });
    }
  }

  const togglePref = (id: string) =>
    update({ pref: prefIds.includes(id) ? prefIds.filter((p) => p !== id) : [...prefIds, id] });

  const showResults = !!(from && to && data);
  const padding = useMemo(
    () => ({
      topLeft: FORM_PAD,
      bottomRight: [showResults ? PANEL_W + 40 : 60, 60] as [number, number],
    }),
    [showResults],
  );

  if (!data) return <section className={`${SECTION_H} bg-surface-muted`} aria-busy="true" />;

  const googleMaps = data.resources.get('google-maps');

  return (
    <section aria-labelledby="plan-title" className={`relative ${SECTION_H} overflow-hidden`}>
      <div className="absolute inset-0 z-0">
        <TripMap
          places={data.places}
          from={from}
          to={to}
          activeId={field === 'from' ? from?.id : to?.id}
          onPick={pickOnMap}
          padding={padding}
        />
      </div>

      {/* Title and form, on a scrim so they don't collide with map labels. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] px-8 pt-[74px]">
        <div className="mx-auto max-w-frame">
          <div className="pointer-events-auto -ml-4 flex w-fit flex-col gap-4 rounded-[12px] bg-white/85 p-4 backdrop-blur-sm">
            <h1 id="plan-title" className="m-0 text-h1 text-ink">
              Plan your trip
            </h1>
            <div className="flex items-end gap-3">
              <div className="flex flex-col gap-4">
                <PlaceCombobox
                  label="From"
                  placeholder={field === 'from' ? 'Click the map' : 'Enter starting point'}
                  places={data.places}
                  value={from}
                  selected={field === 'from'}
                  onActivate={() => setField('from')}
                  other={to}
                  otherNote="Your destination"
                  side="from"
                  googleMaps={googleMaps}
                  onChange={(p) => {
                    update({ from: p ?? null });
                    if (p && !to) setField('to');
                  }}
                  size="sm"
                  className="w-[200px]"
                />
                <PlaceCombobox
                  label="To"
                  placeholder={field === 'to' ? 'Click the map' : 'Enter destination'}
                  places={data.places}
                  value={to}
                  selected={field === 'to'}
                  onActivate={() => setField('to')}
                  other={from}
                  otherNote="Your starting point"
                  side="to"
                  googleMaps={googleMaps}
                  onChange={(p) => update({ to: p ?? null })}
                  size="sm"
                  className="w-[200px]"
                />
              </div>
              <button
                type="button"
                onClick={() => update({ from: to ?? null, to: from ?? null })}
                disabled={!from && !to}
                aria-label="Swap From and To"
                className="mb-[9px] grid size-[32px] place-items-center rounded-pill border border-border-control bg-bg text-body text-ink transition-colors duration-hover hover:bg-surface-muted disabled:opacity-40"
              >
                <span aria-hidden="true">⇅</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showResults && from && to && (
        <Results data={data} from={from} to={to} selectedPrefs={selectedPrefs} onTogglePref={togglePref} />
      )}
    </section>
  );
}

function Results({
  data,
  from,
  to,
  selectedPrefs,
  onTogglePref,
}: {
  data: Data;
  from: Place;
  to: Place;
  selectedPrefs: PlanPreference[];
  onTogglePref: (id: string) => void;
}) {
  const cards = planCards(data.modes, from, to, selectedPrefs);
  const student = isStudentTrip(from, to);
  const airport = isAirportTrip(from, to);
  const extras = selectedPrefs.flatMap((p) =>
    [...p.resourceIds, ...(student ? (p.studentResourceIds ?? []) : [])]
      .map((id) => data.resources.get(id))
      .filter((r): r is Resource => !!r)
      .map((resource) => ({ label: text(p.label), resource })),
  );
  const rideHome = data.programs.get('guaranteed-ride-home');
  const miles = routeMiles(from, to);

  // A new trip starts the panel at the top.
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [from.id, to.id]);

  return (
    <aside
      ref={panelRef}
      aria-label={`Ways to get from ${text(from.name)} to ${text(to.name)}`}
      className="absolute inset-y-0 right-0 z-[500] flex flex-col gap-4 overflow-y-auto bg-bg p-4"
      style={{ width: PANEL_W }}
    >
      <h2 className="m-0 text-body font-medium text-ink">What matters to you?</h2>
      <div className="flex flex-wrap gap-2">
        {data.prefs.map((p) => (
          <Chip
            key={p.id}
            label={text(p.label)}
            selected={selectedPrefs.includes(p)}
            onClick={() => onTogglePref(p.id)}
            className="!min-h-[34px] !px-3 !py-1 !text-small"
          />
        ))}
      </div>
      <ol className="m-0 flex list-none flex-col gap-4 p-0" aria-live="polite">
        {cards.map((c, i) => (
          <li key={c.mode.id}>
            <ModeCard
              card={c}
              from={from}
              to={to}
              resources={data.resources}
              bestMatch={i === 0 && selectedPrefs.length > 0}
              airport={airport}
              ctxGo={data.programs.get('ctx-go')}
              extras={i === 0 ? extras : []}
            />
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 text-small text-ink-muted">
        {rideHome?.url && (
          <p className="m-0">
            Worried about getting stuck?{' '}
            <LinkOut
              href={rideHome.url}
              provider={rideHome.provider}
              label="Guaranteed Ride Home covers up to $75"
              resourceId={rideHome.id}
              from="plan"
            />
          </p>
        )}
        <p className="m-0">
          <span className="font-mono text-data">About {miles.toFixed(1)} mi.</span> Times are estimates. Check the
          planner for live times.
        </p>
      </div>
    </aside>
  );
}
