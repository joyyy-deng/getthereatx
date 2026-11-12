/// <reference types="vite/client" />
import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import categories from './categories.json';
import events from './events.json';
import posts from './posts.json';
import { CONTENT_FILES } from './registry';

// The same checks as `npm run validate-content`, so `npm test` fails on bad content too.
const files = import.meta.glob('./*.json', { eager: true, import: 'default' });

describe('content files', () => {
  for (const [name, schema] of Object.entries(CONTENT_FILES)) {
    it(`${name}.json matches its schema`, () => {
      const data = files[`./${name}.json`];
      expect(data, `${name}.json is missing`).toBeDefined();
      const r = (schema as z.ZodTypeAny).safeParse(data);
      expect(r.success ? [] : r.error.issues.map((i) => `[${i.path.join('.')}] ${i.message}`)).toEqual([]);
    });
  }

  it('every post category exists in categories.json', () => {
    const known = new Set(categories.map((c) => c.slug));
    for (const p of posts) for (const c of p.categories) expect(known, `${p.slug}: ${c}`).toContain(c);
  });

  it('no post uses the removed layout field', () => {
    for (const p of posts) expect(p).not.toHaveProperty('layout');
  });

  it('no post shows a date by default (client request)', () => {
    for (const p of posts) expect((p as { showDate?: boolean }).showDate ?? false).toBe(false);
  });

  it('event cost and organizers match the live calendar (2026-11-12)', () => {
    const ride = events.find((e) => e.id === 'ride-to-the-future') as Record<string, unknown>;
    expect(ride.cost).toBe('$300');
    expect(ride.organizer).toEqual({ name: 'Yellow Bike Project' });
    const clinic = events.find((e) => e.id === 'bicycle-repair-clinic') as Record<string, unknown>;
    expect(clinic.cost).toBeUndefined();
    expect(clinic.organizer).toEqual({ name: 'Austin Public Library', partners: 'Yellow Bike Project' });
  });
});
