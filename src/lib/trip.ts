import type { Place, PlanMode, PlanPreference, Resource } from '../content/schema';
import type { Mode } from '../content/taxonomies';

// Rough trip estimates from the straight-line distance between place
// centroids. Shown as ranges and labeled as estimates on the page.

/** Streets aren't straight: route distance ≈ straight line × this. */
const DETOUR = 1.3;

const WALK_MAX_MI = 2;
const BIKE_MAX_MI = 8;

export function straightMiles(a: Place, b: Place): number {
  const R = 3958.8;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.centroid.lat - a.centroid.lat);
  const dLng = rad(b.centroid.lng - a.centroid.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.centroid.lat)) * Math.cos(rad(b.centroid.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function routeMiles(a: Place, b: Place): number {
  return straightMiles(a, b) * DETOUR;
}

const round5 = (min: number) => Math.max(5, Math.round(min / 5) * 5);

/** [low, high] minutes for a mode over `mi` route miles. */
export function estimateMinutes(mode: Mode, mi: number): [number, number] {
  const ranges: Partial<Record<Mode, [number, number]>> = {
    // 3 mph, ±15%
    walk: [(mi / 3.4) * 60, (mi / 2.6) * 60],
    // 9–12 mph, plus locking up
    bike: [(mi / 12) * 60 + 3, (mi / 9) * 60 + 5],
    // Wait + ride + walk to and from stops
    bus: [10 + (mi / 14) * 60, 20 + (mi / 10) * 60],
    // City traffic, plus finding parking
    drive: [(mi / 30) * 60 + 5, (mi / 20) * 60 + 12],
  };
  const [lo, hi] = ranges[mode] ?? ranges.bus!;
  const low = round5(lo);
  return [low, Math.max(low + 5, round5(hi))];
}

export function isAirportTrip(from: Place, to: Place): boolean {
  return from.id === 'airport' || to.id === 'airport';
}

export function isStudentTrip(from: Place, to: Place): boolean {
  return [from, to].some((p) => p.tags?.includes('student'));
}

export interface CardPlan {
  mode: PlanMode;
  minutes: [number, number];
  /** Bike over 8 mi: shown collapsed as a "Long ride". */
  longRide: boolean;
}

/** Which cards appear, in ranked order. */
export function planCards(modes: PlanMode[], from: Place, to: Place, prefs: PlanPreference[]): CardPlan[] {
  const mi = routeMiles(from, to);
  const airport = isAirportTrip(from, to);

  const cards = modes
    .filter((m) => {
      if (m.id === 'walk') return mi <= WALK_MAX_MI;
      if (m.id === 'bike') return !airport;
      return true;
    })
    .map((m) => ({ mode: m, minutes: estimateMinutes(m.id, mi), longRide: m.id === 'bike' && mi > BIKE_MAX_MI }));

  const prefScore = (c: CardPlan) =>
    prefs.reduce((sum, p) => {
      const i = p.ranking.indexOf(c.mode.id);
      return sum + (i === -1 ? p.ranking.length : i);
    }, 0);

  // Long rides always sink to the bottom; chips re-rank the rest. Ties keep
  // the content order (walk, bike, bus, drive, as in Figma), so a tie never
  // tips toward driving just because it's faster.
  return cards.sort((a, b) => Number(a.longRide) - Number(b.longRide) || prefScore(a) - prefScore(b));
}

/** Fill a resource's deepLink with this trip; falls back to its plain url. */
export function handoffUrl(
  resource: Resource,
  trip: { from?: Place; to?: Place; fromText?: string; toText?: string },
  travelmode?: string,
): string {
  if (!resource.deepLink) return resource.url;
  const values: Record<string, string> = {
    from: trip.from?.mapsQuery ?? trip.fromText ?? '',
    to: trip.to?.mapsQuery ?? trip.toText ?? '',
    mode: travelmode ?? '',
  };
  const url = new URL(resource.deepLink);
  for (const [key, value] of [...url.searchParams]) {
    const m = value.match(/^\{(\w+)\}$/);
    if (!m) continue;
    const filled = values[m[1]];
    if (filled) url.searchParams.set(key, filled);
    else url.searchParams.delete(key);
  }
  return url.toString();
}
