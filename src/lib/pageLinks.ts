/**
 * Links between pages. In the prototype every page is a React route, so this
 * returns null and callers use react-router's Link. Inside WordPress (the
 * gtatx-tools plugin) each tool is mounted alone on a WordPress page, so links
 * to other pages must be plain <a href> to that page's WordPress URL.
 */

/** Prototype route → page name. The plugin's PHP passes in a URL for each name. */
const PAGE_NAMES: Record<string, PageName> = {
  '/': 'home',
  '/plan': 'plan',
  '/community': 'community',
  '/resources': 'resources',
  '/resources/students': 'students',
};

export type PageName = 'home' | 'plan' | 'community' | 'resources' | 'students';
export type PageUrls = Record<PageName, string>;

let pageUrls: PageUrls | null = null;

/** Called once by the WordPress entry (src/wp/main.tsx). */
export function setPageUrls(urls: PageUrls): void {
  pageUrls = urls;
}

/**
 * The plain URL for a prototype route like "/community#events", or null when
 * the prototype's router should handle it. Unknown routes pass through as-is.
 */
export function pageHref(to: string): string | null {
  if (!pageUrls) return null;
  const match = /^([^?#]*)(.*)$/.exec(to)!;
  const name = PAGE_NAMES[match[1].replace(/(.)\/$/, '$1')];
  return name ? pageUrls[name] + match[2] : to;
}
