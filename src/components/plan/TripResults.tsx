import { useEffect, useRef } from 'react';
import type { PageContent, Place, PlanMode, PlanPreference, Program, Resource } from '../../content/schema';
import { text } from '../../lib/i18n';
import { isAirportTrip, isStudentTrip, planCards, routeMiles } from '../../lib/trip';
import { Chip, LinkOut } from '../ui';
import { BottomSheet } from './BottomSheet';
import { PANEL_W, type Snap } from './layout';
import { ModeCard } from './ModeCard';

export interface PlanData {
  places: Place[];
  modes: PlanMode[];
  prefs: PlanPreference[];
  resources: Map<string, Resource>;
  programs: Map<string, Program>;
}

/** Mode cards for a trip: a side panel on desktop, a bottom sheet below 1024px. */
export function TripResults({
  data,
  copy,
  from,
  to,
  selectedPrefs,
  onTogglePref,
  sheet,
}: {
  data: PlanData;
  copy: PageContent['plan'];
  from: Place;
  to: Place;
  selectedPrefs: PlanPreference[];
  onTogglePref: (id: string) => void;
  /** Set on phones and tablets: show the results in a bottom sheet. */
  sheet?: { snap: Snap; onSnap: (snap: Snap) => void; heights: Record<Snap, number> };
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
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panelRef.current?.scrollTo({ top: 0 });
  }, [from.id, to.id]);

  const label = `Ways to get from ${text(from.name)} to ${text(to.name)}`;
  const body = (
    <>
      <h2 className="m-0 text-body font-medium text-ink">{copy.preferencesTitle}</h2>
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
            {copy.rideHome.lead}{' '}
            <LinkOut
              href={rideHome.url}
              provider={rideHome.provider}
              label={copy.rideHome.link}
              resourceId={rideHome.id}
              from="plan"
            />
          </p>
        )}
        <p className="m-0">
          <span className="font-mono text-data">About {miles.toFixed(1)} mi.</span> {copy.estimateNote}
        </p>
      </div>
    </>
  );

  if (sheet) {
    return (
      <BottomSheet
        {...sheet}
        label={label}
        bodyRef={panelRef}
        title={`${cards.length} ways to get from ${text(from.name)} to ${text(to.name)}`}
      >
        {body}
      </BottomSheet>
    );
  }

  return (
    <aside aria-label={label} className="absolute inset-y-0 right-0 z-[500] bg-bg" style={{ width: PANEL_W }}>
      <div ref={panelRef} className="flex size-full flex-col gap-4 overflow-y-auto p-4">
        {body}
      </div>
    </aside>
  );
}
