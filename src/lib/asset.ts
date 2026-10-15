/**
 * Local files in /public are written as "/images/x.png" in code and content.
 * On GitHub Pages the site lives under /getthereatx/, so prefix the base path.
 * Remote URLs pass through unchanged.
 */
export function asset(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return import.meta.env.BASE_URL + path.slice(1);
}
