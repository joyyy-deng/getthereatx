import 'leaflet/dist/leaflet.css';
import { divIcon, latLngBounds, type LatLngExpression, type PathOptions } from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Marker, Polygon, TileLayer, Tooltip, useMap } from 'react-leaflet';
import type { Place } from '../../content/schema';
import { text } from '../../lib/i18n';

// Frames the central neighborhoods to the right of the form.
const AUSTIN: LatLngExpression = [30.283, -97.71];
const DEFAULT_ZOOM = 12.5;

/** Read a design token so map colors stay in tokens.css. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export interface TripMapProps {
  places: Place[];
  from?: Place;
  to?: Place;
  onPick: (place: Place) => void;
  /** The place in the field map clicks will fill; drawn with a heavier outline. */
  activeId?: string;
  /** Pixels hidden behind overlays, so the trip is framed in the visible area. */
  padding: { topLeft: [number, number]; bottomRight: [number, number] };
}

function points(p: Place): [number, number][] {
  return p.polygon ?? [[p.centroid.lat, p.centroid.lng]];
}

/** Re-frames the map whenever From or To changes. */
function FitTrip({ from, to, padding }: Pick<TripMapProps, 'from' | 'to' | 'padding'>) {
  const map = useMap();
  useEffect(() => {
    const picked = [from, to].filter((p): p is Place => !!p);
    if (!picked.length) {
      map.setView(AUSTIN, DEFAULT_ZOOM);
      return;
    }
    const bounds = latLngBounds(picked.flatMap(points));
    map.flyToBounds(bounds, {
      paddingTopLeft: padding.topLeft,
      paddingBottomRight: padding.bottomRight,
      maxZoom: 14,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6,
    });
  }, [map, from, to, padding.topLeft, padding.bottomRight]);
  return null;
}

/** Light street map with clickable neighborhoods (polygons) and destinations (pins). */
export function TripMap({ places, from, to, activeId, onPick, padding }: TripMapProps) {
  const [hover, setHover] = useState<string>();
  const colors = useMemo(
    () => ({
      from: token('--mode-bus'),
      to: token('--color-action'),
      idle: token('--color-ink-muted'),
      pin: token('--color-bg'),
    }),
    [],
  );

  function style(p: Place): PathOptions {
    const role = p.id === from?.id ? 'from' : p.id === to?.id ? 'to' : undefined;
    // dashArray '' clears the idle dashes when a shape becomes selected.
    if (role)
      return {
        color: colors[role],
        weight: p.id === activeId ? 4 : 2,
        dashArray: '',
        fillColor: colors[role],
        fillOpacity: 0.35,
      };
    return {
      color: colors.idle,
      weight: 1,
      dashArray: '4 4',
      fillColor: colors.idle,
      fillOpacity: hover === p.id ? 0.15 : 0,
    };
  }

  const handlers = (p: Place) => ({
    click: () => onPick(p),
    mouseover: () => setHover(p.id),
    mouseout: () => setHover((h) => (h === p.id ? undefined : h)),
  });

  return (
    <MapContainer
      center={AUSTIN}
      zoom={DEFAULT_ZOOM}
      zoomSnap={0.5}
      zoomControl={false}
      scrollWheelZoom={false}
      className="size-full"
      attributionControl
      aria-label="Map of Austin. Click a neighborhood or pin to set From, then To. You can also use the From and To fields."
    >
      {/* Esri light-gray basemap: free for prototypes, no API key. Labels sit on a separate layer. */}
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
        // Hover name for unselected places only; selected names are drawn below.
        const hoverLabel = !selected && (
          <Tooltip
            direction={p.polygon ? 'center' : 'top'}
            offset={p.polygon ? [0, 0] : [0, -10]}
            className="map-label"
          >
            {text(p.name)}
          </Tooltip>
        );
        return p.polygon ? (
          <Polygon key={p.id} positions={p.polygon} pathOptions={style(p)} eventHandlers={handlers(p)}>
            {hoverLabel}
          </Polygon>
        ) : (
          <CircleMarker
            key={p.id}
            center={[p.centroid.lat, p.centroid.lng]}
            radius={8}
            pathOptions={{
              ...style(p),
              dashArray: '',
              weight: 2,
              fillColor: selected ? style(p).fillColor : colors.pin,
              fillOpacity: 1,
            }}
            eventHandlers={handlers(p)}
          >
            {hoverLabel}
          </CircleMarker>
        );
      })}
      {/* Always-on names for From and To (Figma's "DOWNTOWN" / "MUELLER" labels). Separate
          markers, because swapping a bound tooltip in and out can unbind the new one. */}
      {[from, to]
        .filter((p): p is Place => !!p)
        .map((p) => (
          <Marker
            key={`label-${p.id}`}
            position={[p.centroid.lat, p.centroid.lng]}
            interactive={false}
            keyboard={false}
            icon={divIcon({
              className: p.polygon ? 'map-label-anchor' : 'map-label-anchor map-label-anchor--pin',
              html: `<span class="map-label">${text(p.name)}</span>`,
              iconSize: [0, 0],
            })}
          />
        ))}
      <FitTrip from={from} to={to} padding={padding} />
    </MapContainer>
  );
}
