// npm run fetch-share-images [-- --refresh] [-- --only=<text in link>]
// Gives every link in the Resources directory (src/content/resource-list.json) a real
// picture of the linked site, saved in public/images/resources/sites/ (never hotlinked)
// and recorded in src/content/share-images.json, keyed by the link:
//   1. the site's own link-preview picture (og:image / twitter:image) -> kind "preview";
//   2. else a screenshot of the page (Playwright chromium, 1200x750, JPEG) -> kind "screenshot";
//   3. else no picture (the card shows a plain sky panel).
// Never screenshotted: PDFs, login walls, pages that answer with an HTTP error, and
// bot-block / captcha pages. Every saved picture is at most 800px wide and ~150 KB.
// Run it again when the list gets new links; existing pictures are kept unless --refresh.

import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium, type Page } from '@playwright/test';
import sharp from 'sharp';
import { ResourceList } from '../src/content/schema';
import { CONTENT_DIR } from './content';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'public', 'images', 'resources', 'sites');
const MAP_FILE = join(CONTENT_DIR, 'share-images.json');
const REFRESH = process.argv.includes('--refresh');
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const MAX_WIDTH = 800;
const MAX_BYTES = 150_000;
/** A preview picture narrower than this would look blurry in the card, so the page is screenshotted instead. */
const MIN_PREVIEW_WIDTH = 320;
const UA = 'Mozilla/5.0 (compatible; GetThereATX-prototype/1.0; link preview images)';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

/** Links that never get a picture, with why. Login walls first, then pictures removed after looking at the contact sheet. */
const skip: Record<string, string> = {
  'https://book.roundrock.rideco.com/login': 'login wall',
  'https://experience.arcgis.com/experience/119f8c50fe65408584f8150d2702d5fb/page/Mobility-Guide/': 'cookie/disclaimer dialog covers the page',
  'https://experience.arcgis.com/experience/ebf5da1be2464916b70916644d8d363d': 'disclaimer dialog covers the page',
  'https://qmcarsharing.com/': 'cookie wall covers the page',
  'https://texaslonghorns.com/sports/2026/2/10/football-fan-guide': 'cookie wall, page mostly blank',
};
/** Hosts that are login walls for anyone not signed in. */
const LOGIN_HOSTS = ['facebook.com'];

type ShareImages = Record<string, { src: string; from: string; fetched: string; kind: 'preview' | 'screenshot' }>;
const map: ShareImages = existsSync(MAP_FILE) ? JSON.parse(readFileSync(MAP_FILE, 'utf8')) : {};
for (const v of Object.values(map)) v.kind ??= 'preview';

const list = ResourceList.parse(JSON.parse(readFileSync(join(CONTENT_DIR, 'resource-list.json'), 'utf8')));
const links = [...new Set(list.resources.map((r) => r.url))];

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
    if (content) {
      try {
        return new URL(content.replace(/&amp;/g, '&'), page).href;
      } catch {
        // not a usable address
      }
    }
  }
  return undefined;
}

const slug = (url: string) =>
  new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9]+/gi, '-') +
  '-' +
  [...url].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

/** Resize to at most 800px wide and re-encode as JPEG, lowering quality until it is under ~150 KB. */
async function shrink(input: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  for (let width = MAX_WIDTH; width >= 480; width -= 160) {
    for (const quality of [75, 65, 55, 45]) {
      const { data, info } = await sharp(input, { animated: false })
        .rotate()
        .resize({ width, withoutEnlargement: true })
        .flatten({ background: '#ffffff' })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      if (data.length <= MAX_BYTES || (width === 480 && quality === 45)) return { data, width: info.width, height: info.height };
    }
  }
  throw new Error('unreachable');
}

/** Almost one flat colour = a blank page. */
async function isBlank(input: Buffer): Promise<boolean> {
  const { channels } = await sharp(input).stats();
  return channels.slice(0, 3).every((c) => c.stdev < 8);
}

function save(link: string, data: Buffer, from: string, kind: 'preview' | 'screenshot') {
  const name = `${slug(link)}.jpg`;
  writeFileSync(join(OUT, name), data);
  map[link] = { src: `/images/resources/sites/${name}`, from, fetched: new Date().toISOString().slice(0, 10), kind };
}

const BLOCKED = /captcha|are you a robot|verify you are (a )?human|just a moment|attention required|access denied|request blocked|unusual traffic|checking your browser|enable javascript and cookies|pardon our interruption/i;

/** Dismiss a cookie banner the polite way (reject / close), best effort. */
async function dismissBanners(page: Page) {
  for (const name of [/^(reject all|reject|decline|deny|only necessary|necessary only|essential only|no thanks)/i, /^(close|dismiss|got it)$/i]) {
    const button = page.getByRole('button', { name }).first();
    if (await button.isVisible({ timeout: 300 }).catch(() => false)) {
      await button.click({ timeout: 1000 }).catch(() => undefined);
      await page.waitForTimeout(400);
      return;
    }
  }
}

mkdirSync(OUT, { recursive: true });
const none: string[] = [];
let previews = 0;
let shots = 0;

// Pictures for links no longer in the list are dropped; the ones kept are re-encoded under the size limits.
for (const [link, v] of Object.entries(map)) {
  if (!links.includes(link) || link in skip) {
    if (existsSync(join(ROOT, 'public', v.src))) unlinkSync(join(ROOT, 'public', v.src));
    delete map[link];
    console.log(`- dropped the picture of ${link}`);
    continue;
  }
  const file = join(ROOT, 'public', v.src);
  if (!existsSync(file)) {
    delete map[link];
    continue;
  }
  if (!v.src.endsWith('.jpg') || readFileSync(file).length > MAX_BYTES || (await sharp(file).metadata()).width! > MAX_WIDTH) {
    const { data } = await shrink(readFileSync(file));
    unlinkSync(file);
    save(link, data, v.from, v.kind);
    console.log(`~ shrank ${link} to ${Math.round(data.length / 1024)} KB`);
  }
}

const todo = links.filter((l) => (!ONLY || l.includes(ONLY)) && (REFRESH || !map[l] || !existsSync(join(ROOT, 'public', map[l].src))));
const browser = todo.length ? await chromium.launch() : undefined;
const context = await browser?.newContext({ viewport: { width: 1200, height: 750 }, userAgent: BROWSER_UA });

for (const link of todo) {
  const host = new URL(link).hostname.replace(/^www\./, '');
  if (link in skip) {
    none.push(`${link} (${skip[link]})`);
    continue;
  }
  if (LOGIN_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))) {
    none.push(`${link} (login wall)`);
    continue;
  }
  if (/\.pdf($|[?#])/i.test(link)) {
    none.push(`${link} (PDF)`);
    continue;
  }
  let why = '';
  try {
    // 1. The site's own preview picture.
    const res = await get(link);
    const type = res.headers.get('content-type') ?? '';
    if (type.includes('pdf')) {
      none.push(`${link} (PDF)`);
      continue;
    }
    if (res.ok) {
      const img = previewUrl((await res.text()).slice(0, 400_000), res.url || link);
      if (img) {
        const pic = await get(img).catch(() => undefined);
        const bytes = pic?.ok ? Buffer.from(await pic.arrayBuffer()) : undefined;
        if (bytes && bytes.length > 500) {
          try {
            const meta = await sharp(bytes).metadata();
            if ((meta.width ?? 0) >= MIN_PREVIEW_WIDTH && !(await isBlank(bytes))) {
              save(link, (await shrink(bytes)).data, img, 'preview');
              previews++;
              console.log(`✓ preview    ${link}`);
              continue;
            }
            why = `preview picture too small or blank (${meta.width}px)`;
          } catch {
            why = 'preview picture unreadable';
          }
        } else why = 'preview picture could not be downloaded';
      } else why = 'no preview picture';
    } else why = `fetch answered HTTP ${res.status}`;
  } catch (err) {
    why = `fetch failed: ${(err as Error).message}`;
  }

  // 2. A screenshot of the page.
  const page = await context!.newPage();
  try {
    const response = await page.goto(link, { waitUntil: 'load', timeout: 30_000 });
    const status = response?.status() ?? 0;
    if (status >= 400) {
      none.push(`${link} (HTTP ${status})`);
      continue;
    }
    if ((response?.headers()['content-type'] ?? '').includes('pdf')) {
      none.push(`${link} (PDF)`);
      continue;
    }
    await page.waitForTimeout(2500);
    const title = await page.title();
    const body = (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, 1500);
    if (BLOCKED.test(title) || (body.length < 400 && BLOCKED.test(body))) {
      none.push(`${link} (bot-block or captcha page: "${title}")`);
      continue;
    }
    if (/log ?in|sign ?in/i.test(new URL(page.url()).pathname) && body.length < 600) {
      none.push(`${link} (login wall)`);
      continue;
    }
    await dismissBanners(page);
    const shot = await page.screenshot({ type: 'jpeg', quality: 70 });
    if (await isBlank(shot)) {
      none.push(`${link} (blank page)`);
      continue;
    }
    save(link, (await shrink(shot)).data, page.url(), 'screenshot');
    shots++;
    console.log(`✓ screenshot ${link} (${why})`);
  } catch (err) {
    none.push(`${link} (${why}; screenshot failed: ${(err as Error).message.split('\n')[0]})`);
  } finally {
    await page.close();
  }
}
await browser?.close();

writeFileSync(MAP_FILE, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 2) + '\n');

// Files in the folder that nothing points at any more.
const used = new Set(Object.values(map).map((v) => v.src.split('/').pop()));
for (const f of readdirSync(OUT)) if (!used.has(f)) unlinkSync(join(OUT, f));

const kinds = Object.values(map);
console.log(
  `\n${previews} new previews, ${shots} new screenshots. Now ${kinds.filter((v) => v.kind === 'preview').length} previews + ${kinds.filter((v) => v.kind === 'screenshot').length} screenshots of ${links.length} links.`,
);
if (none.length) console.log(`No picture (the card shows a plain sky panel):\n  ${none.join('\n  ')}`);
