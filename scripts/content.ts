// Shared loader for the content scripts: reads every JSON file in src/content.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content');

export const FILES = [
  'resources',
  'posts',
  'events',
  'programs',
  'alerts',
  'places',
  'plan-modes',
  'plan-preferences',
  'connect-cards',
  'explore-places',
  'student-tabs',
  'resource-modes',
  'personas',
  'home',
] as const;
export type ContentFile = (typeof FILES)[number];

export function load(file: ContentFile): unknown {
  return JSON.parse(readFileSync(join(CONTENT_DIR, `${file}.json`), 'utf8'));
}
