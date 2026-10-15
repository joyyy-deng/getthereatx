// Prototype analytics: events are kept in localStorage so a /metrics page can
// read them back in the demo. Swap for a real analytics call in production.

export interface TrackEvent {
  name: string;
  props: Record<string, unknown>;
  at: string;
}

const KEY = 'gtatx:events';

export function track(name: string, props: Record<string, unknown> = {}): void {
  const entry: TrackEvent = { name, props, at: new Date().toISOString() };
  try {
    const all: TrackEvent[] = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    all.push(entry);
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage blocked (private mode): tracking is best-effort.
  }
  if (import.meta.env.DEV) console.info('[track]', name, props);
}

export function readTracked(): TrackEvent[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}
