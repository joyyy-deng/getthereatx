import { describe, expect, it } from 'vitest';
import places from '../content/places.json';
import resources from '../content/resources.json';
import { Places, Resources } from '../content/schema';
import { handoffUrl } from './trip';

const P = Places.parse(places);
const place = (id: string) => P.find((p) => p.id === id)!;
const bikeStreets = Resources.parse(resources).find((r) => r.id === 'bike-streets')!;

describe('Bike Streets hand-off (Bike card)', () => {
  it('opens the low-stress map centered between From and To, zoomed to fit both', () => {
    const url = handoffUrl(bikeStreets, { from: place('downtown'), to: place('mueller') });
    const m = url.match(/^https:\/\/bikestreets\.com\/tx\/austin\/#([\d.]+)\/([\d.]+)\/(-[\d.]+)$/);
    expect(m).not.toBeNull();
    const [, zoom, lat, lng] = m!.map(Number);
    expect(lat).toBeCloseTo((place('downtown').centroid.lat + place('mueller').centroid.lat) / 2, 4);
    expect(lng).toBeCloseTo((place('downtown').centroid.lng + place('mueller').centroid.lng) / 2, 4);
    expect(zoom).toBeGreaterThan(11);
    expect(zoom).toBeLessThan(14);
  });

  it('zooms out further for a longer ride', () => {
    const zoomOf = (u: string) => Number(u.split('#')[1]!.split('/')[0]);
    const near = zoomOf(handoffUrl(bikeStreets, { from: place('downtown'), to: place('east-austin') }));
    const far = zoomOf(handoffUrl(bikeStreets, { from: place('downtown'), to: place('domain') }));
    expect(far).toBeLessThan(near);
  });

  it('opens the plain map when no place is picked', () => {
    expect(handoffUrl(bikeStreets, {})).toBe('https://bikestreets.com/tx/austin/');
  });
});
