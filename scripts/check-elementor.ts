// npm run check:elementor
// Checks every generated template in wordpress/elementor/*.json before Joy imports it.
// Fails (exit 1) on:
//   - broken structure (not an Elementor export, missing or repeated ids, bad element types)
//   - a widget type outside the allow-list
//   - an image address outside the public image base, or a file missing from wordpress/elementor/images/
// and, for the page / header / footer templates built by the responsive generators (home,
// header, footer, community, plan, resources-page):
//   - a container with padding, width, gap or flex direction but no phone (_mobile) value
//   - a font size above 24px with no phone size
//   - a fixed pixel width over 360 with no phone override
//   - text that is not found word for word in the content files (src/content/*.json),
//     the nav / footer links (siteLinks.ts), or the few footer strings listed below.
// It also prints every image the templates use, so you can confirm they are all online
// after the next push.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONTENT_DIR, FILES } from './content';
import { DIRECTORY, LEGAL, SOCIAL, NAV_LINKS } from '../src/components/layout/siteLinks';
import { DEFAULT_IMAGES, IMG_DIR, OUT_DIR } from './elementor-kit';

const BASE = (process.argv.find((a) => a.startsWith('--images='))?.slice(9) ?? DEFAULT_IMAGES).replace(/\/$/, '');

/** Files from the responsive generators: they get the phone and wording rules. */
const STRICT = ['home.json', 'header.json', 'footer.json', 'community.json', 'plan.json', 'resources-page.json'];
const ALLOWED_STRICT = new Set(['heading', 'text-editor', 'image', 'nested-accordion', 'icon', 'shortcode', 'divider', 'spacer', 'button', 'nav-menu', 'loop-grid']);
const ALLOWED_OTHER = new Set([
  ...ALLOWED_STRICT, 'video', 'theme-post-title', 'theme-post-excerpt', 'theme-post-content', 'theme-post-featured-image',
  'gtatx-facts', 'gtatx-steps', 'gtatx-table',
]);
/** Text that lives in the React components, not in a content file. */
const EXTRA_TEXT = ['Keep Austin', 'Moving.', '© 2026 Get There ATX. All rights reserved.', 'Read the guide'];

type Settings = Record<string, unknown>;
interface El { id?: string; elType?: string; widgetType?: string; settings?: Settings; elements?: El[]; isInner?: boolean }

// ---------- wording corpus ----------
const norm = (s: string) => s.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const corpus = new Set<string>();
const collect = (v: unknown) => {
  if (typeof v === 'string') corpus.add(norm(v));
  else if (Array.isArray(v)) v.forEach(collect);
  else if (v && typeof v === 'object') Object.values(v).forEach(collect);
};
for (const f of FILES) collect(JSON.parse(readFileSync(join(CONTENT_DIR, `${f}.json`), 'utf8')));
for (const l of [...DIRECTORY.flat(), ...LEGAL, ...SOCIAL, ...NAV_LINKS]) corpus.add(l.label);
EXTRA_TEXT.forEach((t) => corpus.add(t));
const inCorpus = (t: string) => corpus.has(t);

/** Visible words of a text value: tags removed, <br> splits lines, arrows dropped. */
const fragments = (html: string) =>
  html
    .split(/<br\s*\/?>/i)
    .map((p) => norm(p.replace(/<[^>]*>/g, '').replace(/[↗→]/g, '')))
    .filter(Boolean);

// ---------- checks ----------
const errors: string[] = [];
const images = new Map<string, Set<string>>();
let fileName = '';
const err = (path: string, msg: string) => errors.push(`${fileName}: ${path}: ${msg}`);

const num = (v: unknown): { unit: string; size: number } | undefined =>
  v && typeof v === 'object' && 'size' in v && typeof (v as { size: unknown }).size === 'number'
    ? { unit: String((v as { unit?: string }).unit ?? 'px'), size: (v as { size: number }).size }
    : undefined;

function checkImageValue(path: string, v: unknown) {
  if (!v || typeof v !== 'object' || !('url' in v)) return;
  const url = String((v as { url: unknown }).url);
  if (!url) return;
  if (!url.startsWith(`${BASE}/`)) return err(path, `image ${url} is outside ${BASE}/`);
  const name = url.slice(BASE.length + 1);
  if (!existsSync(join(IMG_DIR, name))) err(path, `image ${name} is not in wordpress/elementor/images/`);
  if (!images.has(name)) images.set(name, new Set());
  images.get(name)!.add(fileName);
}

function walk(el: El, path: string, strict: boolean, ids: Set<string>, top: boolean) {
  if (!el || typeof el !== 'object') return err(path, 'element is not an object');
  if (!el.id || typeof el.id !== 'string') err(path, 'missing id');
  else if (ids.has(el.id)) err(path, `repeated id ${el.id}`);
  else ids.add(el.id);
  if (el.elType !== 'container' && el.elType !== 'widget') return err(path, `bad elType ${String(el.elType)}`);
  if (!el.settings || typeof el.settings !== 'object') return err(path, 'missing settings');
  if (!Array.isArray(el.elements)) return err(path, 'missing elements array');
  const s = el.settings as Settings;
  const where = `${path} (${el.widgetType ?? 'container'})`;

  if (el.elType === 'widget') {
    if (!el.widgetType) err(where, 'widget without widgetType');
    else if (!(strict ? ALLOWED_STRICT : ALLOWED_OTHER).has(el.widgetType)) err(where, `widget type ${el.widgetType} is not in the allow-list`);
    if (el.elements!.length && el.widgetType !== 'nested-accordion') err(where, 'a widget has children');
  } else if (strict) {
    if (top === (el.isInner === true)) err(where, `isInner should be ${!top}`);
    for (const key of ['padding', 'width', 'flex_direction', 'flex_gap']) {
      if (s[key] === undefined) err(where, `no ${key}`);
      for (const d of ['_tablet', '_mobile']) if (s[key] !== undefined && s[key + d] === undefined) err(where, `${key}${d} is missing`);
    }
  }

  for (const [k, v] of Object.entries(s)) {
    if (k === 'image' || k === 'background_image') checkImageValue(`${where}.${k}`, v);
  }

  if (strict) {
    // Font sizes above 24px need a phone size.
    for (const [k, v] of Object.entries(s)) {
      if (!k.endsWith('font_size')) continue;
      const n = num(v);
      if (n && n.size > 24 && s[`${k}_mobile`] === undefined) err(where, `${k} ${n.size}px has no ${k}_mobile`);
    }
    // Fixed pixel widths over 360 need a phone value that fits.
    for (const k of ['width', '_element_custom_width']) {
      const n = num(s[k]);
      if (n && n.unit === 'px' && n.size > 360) {
        const m = num(s[`${k}_mobile`]);
        if (!m || (m.unit === 'px' && m.size > 360)) err(where, `${k} ${n.size}px has no phone override under 360px`);
      }
      const m = num(s[`${k}_mobile`]);
      if (m && m.unit === '%' && m.size > 100) err(where, `${k}_mobile is over 100%`);
    }
    // Wording.
    const texts: string[] = [];
    if (el.widgetType === 'heading' && typeof s.title === 'string') texts.push(s.title);
    if (el.widgetType === 'text-editor' && typeof s.editor === 'string') texts.push(s.editor);
    if (el.widgetType === 'button' && typeof s.text === 'string') texts.push(s.text);
    if (el.widgetType === 'nested-accordion' && Array.isArray(s.items)) for (const i of s.items as { item_title?: string }[]) if (i.item_title) texts.push(i.item_title);
    for (const t of texts) for (const f of fragments(t)) if (!inCorpus(f)) err(where, `text not found in the content files: "${f}"`);
  }

  for (const [i, child] of (el.elements ?? []).entries()) walk(child, `${path}/${i}`, strict, ids, false);
}

const files = readdirSync(OUT_DIR).filter((f) => f.endsWith('.json')).sort();
for (const f of files) {
  fileName = f;
  let t: { version?: string; title?: string; type?: string; content?: El[] };
  try {
    t = JSON.parse(readFileSync(join(OUT_DIR, f), 'utf8'));
  } catch (e) {
    err('', `not valid JSON: ${(e as Error).message}`);
    continue;
  }
  if (!t.version || !t.title || !t.type || !Array.isArray(t.content) || !t.content.length) err('', 'not an Elementor template export (version, title, type, content)');
  if (t.title && !t.title.startsWith('[WKRM] ')) err('', `title "${t.title}" does not start with [WKRM] `);
  const strict = STRICT.includes(f);
  const ids = new Set<string>();
  (t.content ?? []).forEach((el, i) => walk(el, `content/${i}`, strict, ids, true));
}
for (const f of STRICT) if (!files.includes(f)) errors.push(`${f}: file is missing (run npm run build:elementor and build:elementor:site)`);

console.log(`Checked ${files.length} templates (${STRICT.length} with the phone and wording rules).`);
console.log(`Image base: ${BASE}`);
console.log(`Images used by the page templates (${images.size}); all must be online after the push:`);
for (const [name, from] of [...images].sort()) console.log(`  wordpress/elementor/images/${name}  <- ${[...from].join(', ')}`);
if (errors.length) {
  console.error(`\n${errors.length} problem${errors.length === 1 ? '' : 's'}:`);
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
console.log('\nAll good.');
