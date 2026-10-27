import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MOBILE_QUERY, PANEL_W, sheetHeights, type Snap } from '../components/plan/layout';
import { TripForm, type TripField } from '../components/plan/TripForm';
import { TripMap } from '../components/plan/TripMap';
import { TripResults } from '../components/plan/TripResults';
import { PageLoading } from '../components/ui';
import type { Place } from '../content/schema';
import { getPageContent, getPlaces, getPlanConfig, getPrograms, getResources } from '../data';
import { indexBy } from '../lib/indexBy';
import { useContent } from '../lib/useContent';
import { useMediaQuery } from '../lib/useMediaQuery';

// Plan Your Trip (Figma 327:969 → 379:3037 → 407:3588).
// The whole trip lives in the URL: /plan?from=downtown&to=mueller&pref=cost
// so refreshing or sharing the link restores the same screen.

/** Desktop map padding that keeps the trip clear of the form. */
const FORM_PAD: [number, number] = [330, 60];
/** The page fills the screen under the nav (64px on phones, 75px from 768px), with no page scroll. */
const SECTION_H = 'h-[calc(100dvh-64px)] min-h-[480px] md:h-[calc(100dvh-75px)] lg:min-h-[560px]';

export function PlanTrip() {
  const data = useContent(async () => {
    const [copy, places, config, resources, programs] = await Promise.all([
      getPageContent(),
      getPlaces(),
      getPlanConfig(),
      getResources(),
      getPrograms(),
    ]);
    return {
      copy: copy.plan,
      places,
      modes: config.modes,
      prefs: config.preferences,
      resources: indexBy(resources),
      programs: indexBy(programs),
    };
  });
  const [params, setParams] = useSearchParams();
  const [field, setField] = useState<TripField>(params.get('from') ? 'to' : 'from');
  const mobile = useMediaQuery(MOBILE_QUERY);
  const [snap, setSnap] = useState<Snap>('half');
  /** Phones: the From/To card folds into a one-line summary while results show. */
  const [formOpen, setFormOpen] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  /** Section height and the From/To card's bottom edge, for the sheet and map framing. */
  const [box, setBox] = useState({ h: 0, form: 0 });

  const placeById = (id: string | null) => (id ? data?.places.find((p) => p.id === id) : undefined);
  const from = placeById(params.get('from'));
  const toRaw = placeById(params.get('to'));
  const to = toRaw?.id === from?.id ? undefined : toRaw;
  const prefIds = (params.get('pref') ?? '').split(',').filter(Boolean);
  const selectedPrefs = data?.prefs.filter((p) => prefIds.includes(p.id)) ?? [];
  const showResults = !!(from && to);

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

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const form = formRef.current;
    if (!section || !form) return;
    const measure = () => {
      const top = section.getBoundingClientRect().top;
      setBox({ h: section.clientHeight, form: Math.round(form.getBoundingClientRect().bottom - top) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(section);
    ro.observe(form);
    return () => ro.disconnect();
  }, [data]);

  // A new trip opens the sheet halfway and folds the From/To card away.
  useEffect(() => {
    setSnap('half');
    setFormOpen(false);
  }, [from?.id, to?.id]);

  const heights = sheetHeights(box.h, box.form);
  // The map can't show through a full sheet, so frame it for the half sheet instead.
  const sheetH = showResults ? heights[snap === 'full' ? 'half' : snap] : 0;
  const padding = useMemo(
    () =>
      mobile
        ? { topLeft: [24, box.form + 16] as [number, number], bottomRight: [24, sheetH + 24] as [number, number] }
        : { topLeft: FORM_PAD, bottomRight: [showResults ? PANEL_W + 40 : 60, 60] as [number, number] },
    [mobile, showResults, box.form, sheetH],
  );

  if (!data) return <PageLoading className={`${SECTION_H} bg-surface-muted`} />;
  const sheetMode = mobile && showResults;

  return (
    <section ref={sectionRef} aria-labelledby="plan-title" className={`relative ${SECTION_H} overflow-hidden`}>
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

      <TripForm
        ref={formRef}
        title={data.copy.title}
        places={data.places}
        from={from}
        to={to}
        field={field}
        onField={setField}
        onChange={update}
        googleMaps={data.resources.get('google-maps')}
        collapsed={sheetMode && !formOpen}
        onCollapse={sheetMode ? (c) => setFormOpen(!c) : undefined}
      />

      {from && to && (
        <TripResults
          data={data}
          copy={data.copy}
          from={from}
          to={to}
          selectedPrefs={selectedPrefs}
          onTogglePref={togglePref}
          sheet={mobile ? { snap, onSnap: setSnap, heights } : undefined}
        />
      )}
    </section>
  );
}
