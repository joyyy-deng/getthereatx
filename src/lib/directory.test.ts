import { describe, expect, it } from 'vitest';
import { ResourceList, WpDirectory } from '../content/schema';
import list from '../content/resource-list.json';
import { coveredTags, guideTags, labelsIn, matchesTags } from './directory';
import { EVENT_TAG, wpItem } from './directoryItems';

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

describe('directory from WordPress', () => {
  const labels = { linkLabel: 'Visit website', guide: 'Guide', readGuide: 'Read the guide', watchVideo: 'Watch the video', eventAction: 'See the event' };
  const wpList = { ...data, tagAliases: {}, resources: [], guides: [] };

  it('the plugin payload matches the schema, and bad payloads are refused', () => {
    expect(WpDirectory.safeParse({ groups: data.groups, entries: [{ id: 'resource-1', kind: 'site', title: 'CapMetro', url: 'https://www.capmetro.org/', tags: ['bus'] }] }).success).toBe(true);
    expect(WpDirectory.safeParse({ groups: data.groups.slice(0, 2), entries: [] }).success).toBe(false);
  });

  it('sites open outside, guides and events open their WordPress page', () => {
    const site = wpItem(wpList, { id: 'resource-1', kind: 'site', title: 'CapMetro', url: 'https://www.capmetro.org/', tags: ['bus'] }, labels);
    expect(site.action).toMatchObject({ kind: 'out', href: 'https://www.capmetro.org/' });
    const guide = wpItem(wpList, { id: 'post-2', kind: 'guide', title: 'Biking 101', url: 'https://x.test/guides/biking-101/', tags: [], video: true }, labels);
    expect(guide.action).toMatchObject({ kind: 'in', to: 'https://x.test/guides/biking-101/', label: 'Watch the video' });
    expect(guide.eyebrow).toBe('Guide');
  });

  it('the eyebrow follows the filter tree, not the A–Z order WordPress sends', () => {
    const post = wpItem(wpList, { id: 'post-4', kind: 'guide', title: 'Bike Bus', url: 'https://x.test/b/', tags: ['Article', 'Biking', 'bus', 'Community/gettinginvolved', 'Rolling'] }, labels);
    expect(post.eyebrow).toBe(labelsIn(data, ['Rolling', 'Biking', 'bus'], 'mode').join(' · '));
  });

  it('every event counts as Happening in Austin, with its date in the eyebrow', () => {
    const event = wpItem(wpList, { id: 'event-3', kind: 'event', title: 'Bike clinic', url: 'https://x.test/e/', tags: [], venue: 'Central Library' }, labels, 'Sun, Nov 29');
    expect(event.tags).toContain(EVENT_TAG);
    expect(event.eyebrow).toContain('Sun, Nov 29');
    expect(event.meta).toBe('Central Library');
  });
});
