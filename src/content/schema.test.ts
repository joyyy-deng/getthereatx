import { describe, expect, it } from 'vitest';
import { sampleEvent, samplePost } from '../dev/templateSamples';
import { Event, Post } from './schema';

describe('Post schema (blog template blocks)', () => {
  it('accepts every block type the Figma template has', () => {
    const r = Post.safeParse(samplePost);
    expect(r.success).toBe(true);
    const types = new Set(samplePost.body!.map((b) => b.type));
    for (const t of ['facts', 'heading', 'paragraph', 'tip', 'steps', 'image', 'table', 'button']) expect(types).toContain(t);
  });

  it('rejects a table row with the wrong number of cells', () => {
    const bad = { ...samplePost, body: [{ type: 'table', columns: ['A', 'B'], rows: [['1', '2', '3']] }] };
    const r = Post.safeParse(bad);
    expect(r.success).toBe(false);
    expect(JSON.stringify(r.error?.issues)).toContain('one cell per column');
  });

  it('a facts strip takes any number of facts, but not none', () => {
    const items = [1, 2, 3, 4].map((n) => ({ label: `L${n}`, value: `V${n}` }));
    expect(Post.safeParse({ ...samplePost, body: [{ type: 'facts', items }] }).success).toBe(true);
    expect(Post.safeParse({ ...samplePost, body: [{ type: 'facts', items: [] }] }).success).toBe(false);
  });

  it('rejects steps without text', () => {
    expect(Post.safeParse({ ...samplePost, body: [{ type: 'steps', items: [{ title: 'A', text: [] }] }] }).success).toBe(false);
  });

  it('no longer has the article/video layout switch', () => {
    const r = Post.safeParse({ ...samplePost, layout: 'video' });
    expect(r.success && 'layout' in r.data).toBe(false);
  });

  it('showDate is optional and off unless set', () => {
    const r = Post.parse(samplePost);
    expect(r.showDate).toBeUndefined();
  });
});

describe('Event schema (event template fields)', () => {
  it('accepts an event with every optional field', () => {
    expect(Event.safeParse(sampleEvent).success).toBe(true);
  });

  it('accepts an event with none of the optional fields', () => {
    const minimal = {
      id: 'x', slug: 'x', status: 'published', lastReviewed: '2026-10-01',
      title: { en: 'T' }, blurb: { en: 'B' },
      start: '2026-12-05T13:00:00-06:00', end: '2026-12-05T16:00:00-06:00',
      venue: { name: 'V', address: 'A' }, tags: [],
    };
    expect(Event.safeParse(minimal).success).toBe(true);
  });

  it('Getting there needs a label and details for each way', () => {
    expect(Event.safeParse({ ...sampleEvent, gettingThere: [{ label: 'Scooter', details: 'Docks on Lamar' }] }).success).toBe(true);
    expect(Event.safeParse({ ...sampleEvent, gettingThere: [{ label: 'Scooter', details: '' }] }).success).toBe(false);
  });

  it('rejects an empty "what to bring" list (leave it out instead)', () => {
    expect(Event.safeParse({ ...sampleEvent, whatToBring: [] }).success).toBe(false);
  });
});
