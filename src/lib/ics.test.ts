import { describe, expect, it } from 'vitest';
import { sampleEvent } from '../dev/templateSamples';
import { buildIcs, icsEscape, icsHref, icsTime } from './ics';
import { expandEvent } from './recurrence';

const now = new Date('2026-11-12T12:00:00Z');
const BS = String.fromCharCode(92); // a backslash

describe('Add to calendar (.ics)', () => {
  it('writes Austin times as UTC (CST is UTC-6 in December)', () => {
    const [o] = expandEvent(sampleEvent); // 1:00–4:00 PM Austin on Dec 5
    const ics = buildIcs(o, { now });
    expect(ics).toContain('DTSTART:20261205T190000Z');
    expect(ics).toContain('DTEND:20261205T220000Z');
  });

  it('handles daylight saving time (CDT is UTC-5 in September)', () => {
    const e = { ...sampleEvent, start: '2026-09-12T13:00:00-05:00', end: '2026-09-12T17:00:00-05:00' };
    const ics = buildIcs(expandEvent(e)[0], { now });
    expect(ics).toContain('DTSTART:20260912T180000Z');
  });

  it('uses the chosen date of a recurring event', () => {
    const weekly = {
      ...sampleEvent,
      start: '2026-11-07T13:00:00-06:00',
      end: '2026-11-07T17:00:00-06:00',
      recurrence: { freq: 'weekly' as const, byDay: ['SA'], until: '2026-12-31' },
    };
    const second = expandEvent(weekly)[1];
    expect(buildIcs(second, { now })).toContain('DTSTART:20261114T190000Z');
  });

  it('escapes commas, semicolons, backslashes and new lines', () => {
    expect(icsEscape('a, b; c' + BS + 'd\ne')).toBe('a' + BS + ', b' + BS + '; c' + BS + BS + 'd' + BS + 'n' + 'e');
  });

  it('is a valid calendar with CRLF line endings and folded long lines', () => {
    const [o] = expandEvent({ ...sampleEvent, blurb: { en: 'x'.repeat(200) } });
    const ics = buildIcs(o, { now });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true);
    for (const line of ics.split('\r\n')) expect(line.length).toBeLessThanOrEqual(75);
    expect(ics).toContain('LOCATION:Venue name\\, Street address');
  });

  it('icsTime and icsHref', () => {
    expect(icsTime(new Date('2026-09-12T18:00:00.000Z'))).toBe('20260912T180000Z');
    expect(icsHref('A B')).toBe('data:text/calendar;charset=utf-8,A%20B');
  });
});
