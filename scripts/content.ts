// Shared loader for the content scripts: reads every JSON file in src/content.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_FILES, type ContentFile } from '../src/content/registry';

export const CONTENT_DIR = join(import.meta.dirname, '..', 'src', 'content');

export const FILES = Object.keys(CONTENT_FILES) as ContentFile[];
export type { ContentFile };

export function load(file: ContentFile): unknown {
  return JSON.parse(readFileSync(join(CONTENT_DIR, `${file}.json`), 'utf8'));
}
