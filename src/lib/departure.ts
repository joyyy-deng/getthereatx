// "When do you want to leave?" on Plan Your Trip. Times are the visitor's own
// clock, stored in the URL as 24-hour "HH:MM" (?leave=08:15); none = leave now.

const STEP_MIN = 15;
/** How far ahead the menu goes. */
const HOURS_AHEAD = 18;

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

const pad = (n: number) => String(n).padStart(2, '0');
const toValue = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

/** Every quarter hour from the next one, for the next 18 hours. */
export function departureOptions(now = new Date()): { value: string; label: string }[] {
  const first = new Date(now);
  first.setSeconds(0, 0);
  first.setMinutes(Math.ceil((first.getMinutes() + 1) / STEP_MIN) * STEP_MIN);
  return Array.from({ length: (HOURS_AHEAD * 60) / STEP_MIN }, (_, i) => {
    const d = new Date(first.getTime() + i * STEP_MIN * 60_000);
    const tomorrow = d.getDate() !== now.getDate();
    return { value: toValue(d), label: `${timeFormat.format(d)}${tomorrow ? ' tomorrow' : ''}` };
  });
}

/** The departure as a Date: today at "HH:MM" (tomorrow if that time has passed), or now. */
export function departureTime(value: string | null, now = new Date()): Date {
  const m = value?.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return now;
  const d = new Date(now);
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  if (d.getTime() < now.getTime() - 60_000) d.setDate(d.getDate() + 1);
  return d;
}

export function formatTime(d: Date): string {
  return timeFormat.format(d);
}
