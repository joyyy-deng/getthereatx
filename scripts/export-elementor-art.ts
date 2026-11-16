// npm run build:elementor:art
// Renders the vector art and the cropped logos used by the Elementor templates
// into PNG files in wordpress/elementor/images/. Elementor's importer can refuse
// SVG files (the site must allow unfiltered uploads), but it always accepts PNG.
//
//   art-hero-sloth-bus.png   Home hero picture (hero-sloth-bus.svg; the sky is hero-sky.webp)
//   art-guides-kangaroo.png  "See all guides" mascot
//   art-austin-dog.png       "Explore more" / "Explore Austin" mascot (already mirrored, as on the site)
//   art-arrow-{ink,navy,white}.png   Figma's angled arrow (↗), 16px design size at 6×
//   art-logo-nav.png         desktop nav logo (188 × 36 crop of logo-2027.png)
//   art-logo-footer.png      footer / phone-nav logo (330 × 106 crop)
//
// The crops use the same percentages as src/components/layout/Logo.tsx.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'wordpress', 'elementor', 'images');
const TMP = join(process.env.TMPDIR ?? '/tmp', 'gtatx-art');
mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

const browser = await chromium.launch();

/** Screenshot a w × h box of `inner` HTML on a transparent page. */
async function render(file: string, w: number, h: number, inner: string, scale: number) {
  const ctx = await browser.newContext({ viewport: { width: Math.ceil(w), height: Math.ceil(h) }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  const html = join(TMP, `${file}.html`);
  writeFileSync(html, `<!doctype html><html><body style="margin:0;background:transparent;overflow:hidden">${inner}</body></html>`);
  await page.goto(`file://${html}`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: join(OUT, file), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  await ctx.close();
  console.log(`wordpress/elementor/images/${file}`);
}

function svgSize(path: string): [number, number] {
  const head = readFileSync(path, 'utf8').slice(0, 400);
  return [Number(/width="([\d.]+)"/.exec(head)![1]), Number(/height="([\d.]+)"/.exec(head)![1])];
}

async function svg(file: string, src: string, scale: number, flip = false) {
  const path = join(ROOT, 'public', src);
  const [w, h] = svgSize(path);
  await render(file, w, h, `<img src="file://${path}" style="display:block;width:${w}px;height:${h}px;${flip ? 'transform:scaleX(-1)' : ''}">`, scale);
}

await svg('art-hero-sloth-bus.png', 'images/home/hero-sloth-bus.svg', 2);
await svg('art-guides-kangaroo.png', 'images/mascots/guides-kangaroo.svg', 2);
await svg('art-austin-dog.png', 'images/mascots/austin-dog.svg', 2, true);

// Angled arrow in the three text colors used on the pages (theme.json: ink, navy, white).
for (const [name, color] of [['ink', '#111111'], ['navy', '#17324d'], ['white', '#ffffff']] as const) {
  await render(
    `art-arrow-${name}.png`, 16, 16,
    `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" style="display:block"><path d="M3 13L13 3M13 11V3H5" stroke="${color}" stroke-width="2" stroke-linecap="square"/></svg>`,
    6,
  );
}

// Logo crops (Logo.tsx): the image sits inside a fixed-aspect box at these percentages.
const logo = join(ROOT, 'public', 'brand', 'logo-2027.png');
const crop = (w: number, h: number, left: number, top: number, iw: number, ih: number) =>
  `<div style="position:relative;width:${w}px;height:${h}px;overflow:hidden"><img src="file://${logo}" style="position:absolute;max-width:none;left:${left}%;top:${top}%;width:${iw}%;height:${ih}%"></div>`;
await render('art-logo-nav.png', 188, 36, crop(188, 36, -6.11, -160.21, 222.13, 654.55), 3);
await render('art-logo-footer.png', 330, 106, crop(330, 106, -5.7, -65.68, 207.22, 368.18), 3);

await browser.close();
