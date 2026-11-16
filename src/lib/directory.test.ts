import { describe, expect, it } from 'vitest';
import { ResourceList } from '../content/schema';
import list from '../content/resource-list.json';
import { coveredTags, guideTags, labelsIn, matchesTags } from './directory';

const data = ResourceList.parse(list);
const none = { mode: [], who: [], type: [] };

describe('directory filters', () => {
  it('a parent tag covers its children', () => {
    expect(coveredTags(data, 'Rolling')).toEqual(['Rolling', 'Biking', 'Bikeshare', 'Scooters', 'E-scooters']);
    expect(coveredTags(data, 'Biking')).toEqual(['Biking']);
  });

  it('ticking a parent matches anything tagged with a child', () => {
    expect(matchesTags(data, ['Biking', 'Safety'], { ...none, mode: ['Rolling'] })).toBe(true);
    expect(matchesTags(data, ['bus'], { ...none, mode: ['Publictransit'] })).toBe(true);
    expect(matchesTags(data, ['Walking'], { ...none, mode: ['Rolling'] })).toBe(false);
  });

  it('several ticks in a group mean any; different groups all apply', () => {
    expect(matchesTags(data, ['Walking'], { ...none, mode: ['Rolling', 'Walking'] })).toBe(true);
    expect(matchesTags(data, ['Walking', 'Seniors'], { ...none, mode: ['Walking'], who: ['Students'] })).toBe(false);
    expect(matchesTags(data, ['Walking', 'Seniors'], { ...none, mode: ['Walking'], who: ['Students', 'Seniors'] })).toBe(true);
  });

  it('#Carpool/vanpool counts as #Carpool', () => {
    expect(matchesTags(data, ['Carpool/vanpool'], { ...none, mode: ['Carpool'] })).toBe(true);
    expect(matchesTags(data, ['Carpool/vanpool'], { ...none, mode: ['driving'] })).toBe(true);
  });

  it('labels come from the list, in the note\'s order', () => {
    expect(labelsIn(data, ['CapMetro', 'Publictransit', 'bus'], 'mode')).toEqual(['CapMetro', 'Public transit', 'Bus']);
    expect(labelsIn(data, ['HappeninginAustin'], 'type')).toEqual(['Happening in Austin']);
  });

  it('a post is matched to its note by address; one with no note has no tags', () => {
    expect(guideTags(data, { url: 'https://www.getthereatx.com/transit-101/' })).toContain('Publictransit');
    expect(guideTags(data, { url: 'https://www.getthereatx.com/austin-bike-repair-tool-loan-program/' })).toEqual([]);
  });
});
