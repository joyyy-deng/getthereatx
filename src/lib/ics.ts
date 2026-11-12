import type { Occurrence } from './recurrence';
import { text } from './i18n';

// "Add to calendar" on event pages: a one-event .ics file (RFC 5545) for the
// date the page shows. Times are written in UTC (…Z), which every calendar app
// converts back to the reader's own time zone.

/** 2026-09-12T18:00:00.000Z → 20260912T180000Z */
export function icsTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Escape text for an .ics field: backslash, semicolon, comma and newlines. */
export function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 characters are folded (a CRLF and a space), as the format requires. */
function fold(line: string): string {
  const out: string[] = [];
  for (let i = 0; i < line.length; i += 74) out.push((i ? ' ' : '') + line.slice(i, i + 74));
  return out.join('\r\n');
}

export function buildIcs(o: Occurrence, { pageUrl, now = new Date() }: { pageUrl?: string; now?: Date } = {}): string {
  const e = o.event;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Get There ATX//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.id}-${icsTime(o.start)}@getthereatx.com`,
    `DTSTAMP:${icsTime(now)}`,
    `DTSTART:${icsTime(o.start)}`,
    `DTEND:${icsTime(o.end)}`,
    `SUMMARY:${icsEscape(text(e.title))}`,
    `DESCRIPTION:${icsEscape(text(e.blurb))}`,
    `LOCATION:${icsEscape(`${e.venue.name}, ${e.venue.address}`)}`,
    ...(pageUrl ?? e.url ? [`URL:${pageUrl ?? e.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/** A link target that downloads the file, with no server needed. */
export function icsHref(ics: string): string {
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
