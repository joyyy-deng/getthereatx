import { describe, expect, it } from 'vitest';
import pages from '../content/pages.json';
import { samplePost } from '../dev/templateSamples';
import { metaLine, postWords, readMinutes } from './articleMeta';

const copy = pages.guide;

describe('blog meta line', () => {
  it('has no date by default (client request)', () => {
    expect(metaLine(samplePost, copy)).toBe('1 min read  ·  By Get There ATX');
  });

  it('adds "Updated Mon YYYY" only when the post turns the date on', () => {
    expect(metaLine({ ...samplePost, showDate: true }, copy)).toBe('1 min read  ·  Updated Oct 2026  ·  By Get There ATX');
  });

  it('uses the post author when set', () => {
    expect(metaLine({ ...samplePost, author: 'Jane' }, copy)).toContain('By Jane');
  });

  it('counts words in every block type, including steps, facts and tables', () => {
    const words = postWords(samplePost).join(' ');
    for (const w of ['Stations', 'Unlock', 'Row', 'helpful', 'Caption']) expect(words).toContain(w);
  });

  it('rounds the read time to whole minutes, at least 1', () => {
    const long = { ...samplePost, body: [{ type: 'paragraph' as const, text: 'word '.repeat(1000) }] };
    expect(readMinutes(long)).toBe(5);
    expect(readMinutes({ ...samplePost, body: [] })).toBe(1);
  });
});
