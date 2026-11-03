/**
 * Local files in /public are written as "/images/x.png" in code and content.
 * On GitHub Pages the site lives under /getthereatx/, so prefix the base path.
 * Inside WordPress the plugin passes in its own assets URL (setAssetBase).
 * Remote URLs pass through unchanged.
 */
let base = import.meta.env.BASE_URL;

/** Called once by the WordPress entry (src/wp/main.tsx). */
export function setAssetBase(url: string): void {
  base = url.endsWith('/') ? url : url + '/';
}

export function asset(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  return base + path.slice(1);
}
