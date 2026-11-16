// npm run fetch-share-images
// For every link in the Resources directory (the client's Trip Planning sheet),
// reads the site's own link-preview picture (og:image / twitter:image), saves a
// copy in public/images/resources/sites/ (images are never hotlinked) and
// records it in src/content/share-images.json, keyed by the link.
// Run it again when the sheet gets new links; existing pictures are kept unless
// --refresh is given. Links with no preview picture keep their mascot.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTripPlanningSheet } from '../src/content/sheet';
import { CONTENT_DIR } from './content';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'images', 'resources', 'sites');
const MAP_FILE = join(CONTENT_DIR, 'share-images.json');
const REFRESH = process.argv.includes('--refresh');
const MAX_BYTES = 3_000_000;
const UA = 'Mozilla/5.0 (compatible; GetThereATX-prototype/1.0; link preview images)';
const TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/svg+xml': 'svg' };

type ShareImages = Record<string, { src: string; from: string; fetched: string }>;
const map: ShareImages = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {};

async function get(url: string) {
  return fetch(url, { headers: { 'user-agent': UA, accept: 'text/html,image/*;q=0.9,*/*;q=0.8' }, redirect: 'follow', signal: AbortSignal.timeout(15_000) });
}

/** The page's own preview picture, from its meta tags. */
function previewUrl(html: string, page: string): string | undefined {
  const metas = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]);
  const attr = (tag: string, name: string) => new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, 'i').exec(tag)?.[1];
  for (const key of ['og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src']) {
    const tag = metas.find((t) => (attr(t, 'property') ?? attr(t, 'name'))?.toLowerCase() === key);
    const content = tag && attr(tag, 'content');
    if (content) return new URL(content.replace(/&amp;/g, '&'), page).href;
  }
  return undefined;
}

const slug = (url: string) =>
  new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-') +
  '-' +
  [...url].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

const { entries } = readTripPlanningSheet(readFileSync(join(CONTENT_DIR, 'sheets', 'trip-planning.csv'), 'utf8'));
const links = [...new Set(entries.map((e) => e.url).filter((u): u is string => !!u))];
mkdirSync(OUT, { recursive: true });
let added = 0;
const missing: string[] = [];

for (const link of links) {
  if (map[link] && !REFRESH && existsSync(join(ROOT, 'public', map[link].src))) continue;
  try {
    const page = await get(link);
    const html = (await page.text()).slice(0, 400_000);
    const img = previewUrl(html, page.url || link);
    if (!img) {
      missing.push(`${link} (no preview picture)`);
      continue;
    }
    const res = await get(img);
    const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
    const ext = TYPES[type];
    const bytes = Buffer.from(await res.arrayBuffer());
    if (!res.ok || !ext || bytes.length > MAX_BYTES || bytes.length < 500) {
      missing.push(`${link} (preview picture unusable: ${res.status} ${type} ${bytes.length} bytes)`);
      continue;
    }
    const name = `${slug(link)}.${ext}`;
    writeFileSync(join(OUT, name), bytes);
    map[link] = { src: `/images/resources/sites/${name}`, from: img, fetched: new Date().toISOString().slice(0, 10) };
    added++;
    console.log(`✓ ${link} → ${name}`);
  } catch (err) {
    missing.push(`${link} (${(err as Error).message})`);
  }
}

writeFileSync(MAP_FILE, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 2) + '\n');
console.log(`\n${added} new pictures; ${Object.keys(map).length} of ${links.length} links have one.`);
if (missing.length) console.log(`No picture (they keep their mascot):\n  ${missing.join('\n  ')}`);
