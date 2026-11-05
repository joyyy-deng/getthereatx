import type { Theme } from '../content/schema';

/**
 * Set the theme's colors and fonts as CSS variables on `el` (<html> in the
 * prototype, each .gtatx-app wrapper inside WordPress). Tailwind classes like
 * bg-navy read these variables, so a new value recolors every component.
 * Also loads the theme's web font stylesheets (the Adobe Fonts kit) once.
 */
export function applyTheme(theme: Theme, el: HTMLElement = document.documentElement): void {
  for (const [name, { value }] of Object.entries(theme.colors)) el.style.setProperty(`--${name}`, value);
  el.style.setProperty('--font-sans', theme.font.sans);
  el.style.setProperty('--font-mono', theme.font.mono);
  for (const href of theme.font.stylesheets) {
    if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.append(link);
  }
}
