import type { Event } from '../content/schema';

// Human-readable dates for event cards. All times are Austin time.

const TZ = 'America/Chicago';
const DAY_NAMES: Record<string, string> = {
  MO: 'Monday',
  TU: 'Tuesday',
  WE: 'Wednesday',
  TH: 'Thursday',
  FR: 'Friday',
  SA: 'Saturday',
  SU: 'Sunday',
};
const ORDINALS: Record<string, string> = { '1': 'First', '2': 'Second', '3': 'Third', '4': 'Fourth', '-1': 'Last' };

const time = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ });
const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ });
const shortDate = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function timeRange(start: Date, end: Date): string {
  return `${time.format(start)}–${time.format(end)}`;
}

/** "Every Wednesday through Dec 16", "Last Sunday of each month through Dec 31", or null. */
export function recurrenceText(event: Event): string | null {
  const r = event.recurrence;
  if (!r) return null;
  const until = `through ${shortDate.format(new Date(r.until))}`;
  const rules = r.byDay ?? [];
  if (r.freq === 'weekly') {
    const days = rules.map((d) => DAY_NAMES[d]).join(' & ');
    return `Every ${days} ${until}`;
  }
  const m = rules[0]?.match(/^(-?[1-5])?(MO|TU|WE|TH|FR|SA|SU)$/);
  if (m) return `${ORDINALS[m[1] ?? '1'] ?? ''} ${DAY_NAMES[m[2]]} of each month ${until}`.trim();
  return `Monthly ${until}`;
}

/** "Next: Wed, Oct 21 · 8:45–10:00 AM" style line for the next occurrence. */
export function nextText(start: Date, end: Date): string {
  return `${day.format(start)} · ${timeRange(start, end)}`;
}
