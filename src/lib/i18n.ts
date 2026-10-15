import type { L } from '../content/schema';

export type Lang = 'en' | 'es';

/** Pick the language, falling back to English. The EN/ES toggle comes in Phase 6. */
export function text(value: L, lang: Lang = 'en'): string {
  return (lang === 'es' && value.es) || value.en;
}
