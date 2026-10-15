import type { Event } from '../content/schema';

// Expands one recurring Event record into dated occurrences.
// Times are Austin wall-clock times, so DST is handled per occurrence.

const TZ = 'America/Chicago';
const DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export interface Occurrence {
  event: Event;
  start: Date;
  end: Date;
}

/** Offset of America/Chicago from UTC, in ms, at the given instant. */
function tzOffset(at: number): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(new Date(at))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return asUtc - at;
}

/** Austin wall-clock date + time to a real instant. */
function austinTime(y: number, m: number, d: number, time: string): Date {
  const [hh, mm] = time.split(':').map(Number);
  const guess = Date.UTC(y, m, d, hh, mm);
  const first = guess - tzOffset(guess);
  return new Date(guess - tzOffset(first));
}

function matchesMonthly(date: Date, rule: string): boolean {
  const m = rule.match(/^(-?[1-5])?(MO|TU|WE|TH|FR|SA|SU)$/);
  if (!m || DAYS[date.getUTCDay()] !== m[2]) return false;
  if (!m[1]) return true;
  const n = Number(m[1]);
  const day = date.getUTCDate();
  if (n > 0) return Math.ceil(day / 7) === n;
  const daysInMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return Math.ceil((daysInMonth - day + 1) / 7) === -n;
}

export function expandEvent(event: Event): Occurrence[] {
  const startTime = event.start.slice(11, 16);
  const endTime = event.end.slice(11, 16);
  const [y, m, d] = event.start.slice(0, 10).split('-').map(Number);
  const r = event.recurrence;
  if (!r) return [{ event, start: new Date(event.start), end: new Date(event.end) }];

  const startDay = event.start.slice(0, 10);
  const byDay = r.byDay ?? [DAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]];
  const out: Occurrence[] = [];
  for (let t = Date.UTC(y, m - 1, d); ; t += 86_400_000) {
    const day = new Date(t);
    const iso = day.toISOString().slice(0, 10);
    if (iso > r.until) break;
    if (iso < startDay) continue;
    const hit =
      r.freq === 'weekly' ? byDay.includes(DAYS[day.getUTCDay()]) : byDay.some((rule) => matchesMonthly(day, rule));
    if (!hit) continue;
    const [yy, mm, dd] = [day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()];
    out.push({ event, start: austinTime(yy, mm, dd, startTime), end: austinTime(yy, mm, dd, endTime) });
  }
  return out;
}
