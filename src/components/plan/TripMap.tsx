import 'leaflet/dist/leaflet.css';
import { divIcon, latLngBounds, point, type LatLngExpression, type LeafletEvent, type LeafletMouseEvent, type Path, type PathOptions } from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { CircleMarker, MapContainer, Marker, Polygon, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { Place } from '../../content/schema';
import { text } from '../../lib/i18n';
import { ArrowUp } from '../ui/Arrow';

// Real Leaflet map, styled like the Figma "Austin route map" (775:3888):
// cream-tinted streets, a green line from A to B with the travel time, white
// name labels and square zoom controls. The line is straight: there is no
// routing service, so the page labels it as a sketch, not a street route.

// Central Austin, close enough to see streets and the neighborhoods you can pick.
const AUSTIN: LatLngExpression = [30.283, -97.728];
const DEFAULT_ZOOM = 13;
// Room for the A / B name labels around the ends of the line.
const PAD: [number, number] = [72, 56];

/**
 * Read a design token so map colors stay in theme.json. Inside WordPress the
 * tokens live on the plugin's .gtatx-app wrapper instead of <html>.
 */
function token(name: string): string {
  const scope = document.querySelector('.gtatx-app') ?? document.documentElement;
  return getComputedStyle(scope).getPropertyValue(name).trim();
}

export interface TripMapProps {
  places: Place[];
  from?: Place;
  to?: Place;
  /** Shown on the line, e.g. "32 min". */
  badge?: string;
  /** The picked mode ("walk", "bike", "bus", "drive"): the line takes its color and style. */
  mode?: string;
  /** Click a neighborhood or pin to fill From, then To. */
  onPick: (place: Place) => void;
}

const center = (p: Place): [number, number] => [p.centroid.lat, p.centroid.lng];

/**
 * Motion Lab "Route restyle": each mode draws the line its own way: dotted for
 * walking, dashed for biking, stops for the bus, solid for driving. Colors are the
 * GetThereATX brand colors (theme.json), Joy 2026-11-19: leaf, route green, link
 * blue, navy. Gaps are wide so the white casing shows between dashes.
 */
const ROUTE_DASH: Record<string, string> = { walk: '1 16', bike: '14 14' };
/** Where the bus line gets stop dots (fractions of the way); the middle stays clear for the badge. */
const BUS_STOPS = [0.25, 0.75];

/** Which way B lies from A on screen, so the line wipes in starting at A. */
function heading(from: Place, to: Place): 'e' | 'w' | 'n' | 's' {
  const dx = (to.centroid.lng - from.centroid.lng) * Math.cos((from.centroid.lat * Math.PI) / 180);
  const dy = to.centroid.lat - from.centroid.lat;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'e' : 'w';
  return dy >= 0 ? 'n' : 's';
}

/**
 * What to frame: both ends of a trip (the line runs centroid to centroid, and
 * whole neighborhood shapes would zoom out too far), or one picked place's shape.
 */
function frame(picked: Place[]) {
  return latLngBounds(picked.length > 1 ? picked.map(center) : (picked[0].polygon ?? [center(picked[0])]));
}

/** Frames the trip (or Austin) whenever From or To changes. */
function FitTrip({ from, to }: Pick<TripMapProps, 'from' | 'to'>) {
  const map = useMap();
  const first = useRef(true);
  useEffect(() => {
    const picked = [from, to].filter((p): p is Place => !!p);
    // The first framing is instant, so a new map opens on the trip instead of
    // flying in from the default view. Later changes glide.
    const animate = !first.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    first.current = false;
    if (!picked.length) {
      map.setView(AUSTIN, DEFAULT_ZOOM, { animate });
      return;
    }
    const bounds = frame(picked);
    if (!animate) {
      map.fitBounds(bounds, { padding: PAD, maxZoom: 14, animate: false });
      return;
    }
    // A small move (same zoom, give or take one step) glides straight there; flying out and back
    // in for a nearby place felt like a lurch. Bigger jumps still fly, a little slower.
    const zoomStep = Math.abs(Math.min(14, map.getBoundsZoom(bounds, false, point(PAD[0] * 2, PAD[1] * 2))) - map.getZoom());
    if (zoomStep <= 1) map.fitBounds(bounds, { padding: PAD, maxZoom: 14, animate: true, duration: 0.7, easeLinearity: 0.25 });
    else map.flyToBounds(bounds, { padding: PAD, maxZoom: 14, duration: 1.1, easeLinearity: 0.15 });
  }, [map, from, to]);
  return null;
}

/** Figma "Map controls": N ↑ (reset), +, −, as 36px white squares. */
function Controls({ from, to }: Pick<TripMapProps, 'from' | 'to'>) {
  const map = useMap();
  const btn =
    'grid size-9 place-items-center bg-bg text-ink shadow-[0_1px_2px_rgb(0_0_0/0.15)] transition-colors duration-hover hover:bg-sky';
  function reset() {
    const picked = [from, to].filter((p): p is Place => !!p);
    if (picked.length) map.fitBounds(frame(picked), { padding: PAD, maxZoom: 14 });
    else map.setView(AUSTIN, DEFAULT_ZOOM);
  }
  return (
    <div className="absolute right-3 top-3 z-[500] flex flex-col gap-1 lg:right-6 lg:top-6">
      <button type="button" onClick={reset} aria-label="Reset the map to the trip" className={`${btn} text-[16px] font-semibold`}>
        <span className="flex items-center gap-[2px]">
          N
          <ArrowUp className="size-3" />
        </span>
      </button>
      <button type="button" onClick={() => map.zoomIn()} aria-label="Zoom in" className={`${btn} text-[24px]`}>
        +
      </button>
      <button type="button" onClick={() => map.zoomOut()} aria-label="Zoom out" className={`${btn} text-[24px]`}>
        −
      </button>
    </div>
  );
}

const label = (html: string, className = 'trip-map-label') =>
  divIcon({ className: 'trip-map-anchor', html: `<span class="${className}">${html}</span>`, iconSize: [0, 0] });

const escape = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export function TripMap({ places, from, to, badge, mode, onPick }: TripMapProps) {
  // The latest onPick, so the map's click handlers never need re-binding.
  const pickRef = useRef(onPick);
  pickRef.current = onPick;
  const colors = useMemo(
    () => ({
      route: token('--color-route'),
      from: token('--mode-bus'),
      idle: token('--color-map-label'),
      white: token('--color-bg'),
      walk: token('--color-leaf'),
      bike: token('--color-route'),
      bus: token('--color-link'),
      drive: token('--color-navy'),
    }),
    [],
  );
  const lineColor = (mode && colors[mode as 'walk' | 'bike' | 'bus' | 'drive']) || colors.route;
  const trip = from && to;

  function style(p: Place): PathOptions {
    const role = p.id === from?.id ? 'from' : p.id === to?.id ? 'to' : undefined;
    // dashArray '' clears the idle dashes when a shape becomes selected.
    if (role)
      return {
        color: role === 'from' ? colors.from : colors.route,
        weight: 2,
        dashArray: '',
        fillColor: role === 'from' ? colors.from : colors.route,
        fillOpacity: trip ? 0.12 : 0.3,
      };
    return {
      color: colors.idle,
      weight: 1,
      dashArray: '4 4',
      fillColor: colors.idle,
      fillOpacity: 0,
    };
  }

  // One set of handlers per place, made once. Hover tints the shape directly
  // (no React state), so moving the mouse never re-renders the map.
  const selectedIds = useRef<string[]>([]);
  selectedIds.current = [from?.id, to?.id].filter((id): id is string => !!id);
  const handlers = useMemo(() => {
    const tint = (e: LeafletMouseEvent, p: Place, on: boolean) => {
      if (p.polygon && !selectedIds.current.includes(p.id)) (e.target as Path).setStyle({ fillOpacity: on ? 0.15 : 0 });
    };
    return new Map(
      places.map((p) => [
        p.id,
        {
          click: () => pickRef.current(p),
          // Shapes are mouse shortcuts (keyboard users pick in the From/To
          // fields), so they stay out of the Tab order: no invisible stops.
          add: (e: LeafletEvent) => (e.target as Path).getElement()?.setAttribute('tabindex', '-1'),
          mouseover: (e: LeafletMouseEvent) => tint(e, p, true),
          mouseout: (e: LeafletMouseEvent) => tint(e, p, false),
        },
      ]),
    );
  }, [places]);

  // Marker icons are rebuilt only when their text changes; a new icon object
  // makes Leaflet replace the marker's element, which looked like flicker.
  const fromName = from ? text(from.name) : '';
  const toName = to ? text(to.name) : '';
  const icons = useMemo(
    () => ({
      fromLabel: label(escape(fromName), 'trip-map-label trip-map-label--below'),
      toLabel: label(escape(toName), 'trip-map-label trip-map-label--above'),
      toPin: label('B', 'trip-map-pin'),
      badge: divIcon({
        className: 'trip-map-anchor',
        // White text fails on leaf (2.5:1), so the walking badge uses ink text.
        html: `<span class="trip-map-badge" style="--badge-c:${escape(lineColor)}${mode === 'walk' ? ';color:var(--color-ink)' : ''}">${escape(badge ?? '')}</span>`,
        iconSize: [0, 0],
      }),
    }),
    [fromName, toName, badge, lineColor, mode],
  );

  const mid: [number, number] | undefined = trip
    ? [(from.centroid.lat + to.centroid.lat) / 2, (from.centroid.lng + to.centroid.lng) / 2]
    : undefined;

  return (
    <div className="trip-map relative size-full bg-map-land">
      <MapContainer
        center={AUSTIN}
        zoom={DEFAULT_ZOOM}
        // Whole zoom steps only: in-between steps stretch the map images and blur them.
        zoomSnap={1}
        minZoom={10}
        zoomControl={false}
        scrollWheelZoom={false}
        className="size-full"
        attributionControl
        aria-label="Map of Austin. Click a neighborhood or pin to set From, then To. You can also use the From and To fields."
      >
        {/* Esri light-gray basemap: free for prototypes, no API key. */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors · Neighborhoods: City of Austin"
          maxZoom={16}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />
        {places.map((p) => {
          const selected = p.id === from?.id || p.id === to?.id;
          const hoverLabel = !selected && (
            <Tooltip direction={p.polygon ? 'center' : 'top'} offset={p.polygon ? [0, 0] : [0, -10]} className="map-label">
              {text(p.name)}
            </Tooltip>
          );
          return p.polygon ? (
            <Polygon key={p.id} positions={p.polygon} pathOptions={style(p)} eventHandlers={handlers.get(p.id)}>
              {hoverLabel}
            </Polygon>
          ) : (
            !selected && (
              <CircleMarker
                key={p.id}
                center={center(p)}
                radius={7}
                pathOptions={{ ...style(p), dashArray: '', weight: 2, fillColor: colors.white, fillOpacity: 1 }}
                eventHandlers={handlers.get(p.id)}
              >
                {hoverLabel}
              </CircleMarker>
            )
          );
        })}

        {trip && (
          <>
            {/* Figma "Route casing" + "Selected route". Keyed by the trip only: a new trip draws the
                line from A toward B (index.css .trip-route--e/w/n/s); picking another card restyles
                it in place, with no disappearing and redrawing (Joy 2026-11-19: no blinking). */}
            <Polyline
              key={`casing-${from.id}-${to.id}`}
              positions={[center(from), center(to)]}
              pathOptions={{ color: colors.white, weight: 14, opacity: 1, className: `trip-route--${heading(from, to)}` }}
            />
            <Polyline
              key={`route-${from.id}-${to.id}`}
              positions={[center(from), center(to)]}
              pathOptions={{
                color: lineColor,
                weight: 5,
                opacity: 1,
                dashArray: ROUTE_DASH[mode ?? ''] ?? '',
                className: `trip-route--${heading(from, to)}`,
              }}
            />
            {mode === 'bus' &&
              BUS_STOPS.map((f, i) => (
                <CircleMarker
                  key={`stop-${from.id}-${to.id}-${i}`}
                  center={[
                    from.centroid.lat + (to.centroid.lat - from.centroid.lat) * f,
                    from.centroid.lng + (to.centroid.lng - from.centroid.lng) * f,
                  ]}
                  radius={5}
                  interactive={false}
                  pathOptions={{ color: lineColor, weight: 2.5, fillColor: colors.white, fillOpacity: 1, className: 'trip-stop' }}
                />
              ))}
          </>
        )}
        {from && (
          <>
            {/* Figma "Origin halo". */}
            <CircleMarker
              center={center(from)}
              radius={9}
              interactive={false}
              pathOptions={{ color: colors.route, weight: 4, fillColor: colors.white, fillOpacity: 1 }}
            />
            <Marker
              position={center(from)}
              interactive={false}
              keyboard={false}
              icon={icons.fromLabel}
            />
          </>
        )}
        {to && (
          <>
            {/* Figma "Destination marker": green square with B. */}
            <Marker
              position={center(to)}
              interactive={false}
              keyboard={false}
              icon={icons.toPin}
            />
            <Marker
              position={center(to)}
              interactive={false}
              keyboard={false}
              icon={icons.toLabel}
            />
          </>
        )}
        {mid && badge && (
          <Marker position={mid} interactive={false} keyboard={false} icon={icons.badge} />
        )}
        <FitTrip from={from} to={to} />
        <Controls from={from} to={to} />
      </MapContainer>
    </div>
  );
}
