// Shared pieces for the Elementor generators (build-elementor-home.ts,
// build-elementor-site.ts): setting helpers, responsive values, widgets, and the
// two components that appear on more than one page (Get there together band,
// mascot card).
//
// Rules every piece follows (checked by scripts/check-elementor.ts):
//   - Only native Elementor widgets. Colors and fonts are set on each widget,
//     never in Site Settings.
//   - Every container carries flex direction, padding, gap and width for desktop,
//     tablet and phone (the _tablet / _mobile variants). Elementor's own defaults
//     (10px padding, 20px gap, wrap on phones) would otherwise leak in.
//   - Sizes come from the React classes. React's `text-fluid [--m:x] [--d:y]` is
//     exact at 393 and 1440 and linear in between; Elementor has steps, so the
//     phone value is x, desktop y, and tablet (768) the value the line gives there.
//   - Phones: 24px side padding, nothing wider than the screen (percent widths,
//     pixel widths only up to 360), tap targets 44px or more.

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { load } from './content';

export const ROOT = join(import.meta.dirname, '..');
export const OUT_DIR = join(ROOT, 'wordpress', 'elementor');
export const IMG_DIR = join(OUT_DIR, 'images');

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
/** The address the importer downloads images from (default: this repo's raw GitHub folder). */
export const DEFAULT_IMAGES = 'https://raw.githubusercontent.com/joyyy-deng/getthereatx/main/wordpress/elementor/images';
export const IMAGES = (arg('images') ?? DEFAULT_IMAGES).replace(/\/$/, '');

/** WordPress page addresses (same defaults as the gtatx-tools plugin). */
export const PAGES = { home: '/', plan: '/plan-your-trip/', community: '/community/', resources: '/resources/' };

// ---------- content ----------
const theme = load('theme') as { colors: Record<string, { value: string }> };
/** A theme.json color by name. */
export const c = (name: string) => {
  const v = theme.colors[name]?.value;
  if (!v) throw new Error(`theme.json has no color "${name}"`);
  return v;
};
export const FONT = 'ff-real-text-pro';

// ---------- basics ----------
export type Settings = Record<string, unknown>;
export type El = { id: string; elType: string; settings: Settings; elements: El[]; isInner?: boolean; widgetType?: string };

const newId = () => randomBytes(4).toString('hex').slice(0, 7);
export const id = newId;
export const px = (size: number) => ({ unit: 'px', size, sizes: [] });
export const pct = (size: number) => ({ unit: '%', size, sizes: [] });
export const box = (top: number, right = top, bottom = top, left = right) => ({
  unit: 'px', top: String(top), right: String(right), bottom: String(bottom), left: String(left),
  isLinked: top === right && right === bottom && bottom === left,
});
export const gapv = (n: number) => ({ column: String(n), row: String(n), isLinked: true, unit: 'px', size: n });

/** Prototype route (/plan, /community#events) → WordPress page address. */
export function href(to: string): string {
  const cut = to.search(/[?#]/);
  const [path, rest] = cut === -1 ? [to, ''] : [to.slice(0, cut), to.slice(cut)];
  const map: Record<string, string> = { '/plan': PAGES.plan, '/community': PAGES.community, '/resources': PAGES.resources };
  return (map[path] ?? path) + rest;
}

// ---------- images ----------
const copied = new Set<string>();
/** Every image file the generated templates point at (for the report). */
export const usedImages = () => [...copied].sort();
/**
 * An Elementor image value. `src` starting with "/" is a file in /public (copied
 * into wordpress/elementor/images/); anything else is a file already in that folder.
 */
export function image(src: string, alt = '') {
  const name = basename(src);
  if (src.startsWith('/') && !copied.has(name)) {
    mkdirSync(IMG_DIR, { recursive: true });
    copyFileSync(join(ROOT, 'public', src), join(IMG_DIR, name));
  }
  if (!existsSync(join(IMG_DIR, name))) throw new Error(`image ${name} is not in wordpress/elementor/images/ (run npm run build:elementor:art?)`);
  copied.add(name);
  return { url: `${IMAGES}/${name}`, id: '', alt, source: 'library' };
}

// ---------- responsive values ----------
type Dev = 'desktop' | 'tablet' | 'mobile';
/**
 * One setting for desktop / tablet / phone. Tablet defaults to desktop and the
 * phone to tablet, as in Elementor, but both are always written out so the file
 * says what each size does.
 */
export function rs<T>(key: string, d: T, t: T = d, m: T = t): Settings {
  return { [key]: d, [`${key}_tablet`]: t, [`${key}_mobile`]: m };
}
const unitVal = (v: string | number): Settings => {
  if (typeof v === 'number') return px(v);
  if (v === 'fit-content') return { unit: 'custom', size: 'fit-content', sizes: [] };
  return v.endsWith('%') ? pct(parseFloat(v)) : px(parseFloat(v));
};
export type Len = string | number;
/** Direction of a container: 'row' | 'column'. */
export const dir = (d: string, t = d, m = t) => rs('flex_direction', d, t, m);
export const gap = (d: number, t = d, m = t) => rs('flex_gap', gapv(d), gapv(t), gapv(m));
export const pad = (d: Settings, t = d, m = t) => rs('padding', d, t, m);
/** Container width: '38%' | '240px' | 'fit-content' (a bare number is px). */
export const wd = (d: Len, t = d, m = t) => rs('width', unitVal(d), unitVal(t), unitVal(m));
export const minH = (d: number, t = d, m = t) => rs('min_height', px(d), px(t), px(m));
export const justify = (d: string, t = d, m = t) => rs('flex_justify_content', d, t, m);
export const align = (d: string, t = d, m = t) => rs('flex_align_items', d, t, m);
/** Hide an element on some screens: hide('tablet', 'mobile') = desktop only. */
export const hide = (...devs: Dev[]): Settings => Object.fromEntries(devs.map((v) => [`hide_${v}`, `hidden-${v}`]));
/** A widget's own width in a row: percent or px, per size. */
export const selfW = (d: Len, t = d, m = t): Settings => ({
  _element_width: 'initial',
  ...rs('_element_custom_width', unitVal(d), unitVal(t), unitVal(m)),
});

// ---------- type ----------
/** Tablet = the value React's fluid size has at 768px (between the 393 phone and 1440 desktop sizes). */
export const midSize = (d: number, m: number) => Math.round(m + (d - m) * ((768 - 393) / (1440 - 393)));

interface TypeOpts {
  /** Line height in em as [desktop, phone] (or one number), or a px string like '24px' / ['28px','24px']. */
  lh?: number | string | [number | string, number | string];
  /** Letter spacing in em (React's tracking-[-0.01em] = -0.01). */
  ls?: number;
  upper?: boolean;
  underline?: boolean;
  /** Override the tablet size (default: the fluid value at 768). */
  tablet?: number;
}
const lineHeight = (v: number | string): Settings => (typeof v === 'string' ? { unit: 'px', size: parseFloat(v), sizes: [] } : { unit: 'em', size: v, sizes: [] });
/** Typography for desktop size `d` and phone size `m`, weight as a string ('400', '600', '700'). */
export function ty(d: number, m: number, weight: string, o: TypeOpts = {}): Settings {
  const t = o.tablet ?? midSize(d, m);
  const out: Settings = {
    typography_typography: 'custom',
    typography_font_family: FONT,
    typography_font_weight: weight,
    ...rs('typography_font_size', px(d), px(t), px(m)),
  };
  if (o.lh !== undefined) {
    const [ld, lm] = Array.isArray(o.lh) ? o.lh : [o.lh, o.lh];
    Object.assign(out, rs('typography_line_height', lineHeight(ld), lineHeight(lm), lineHeight(lm)));
  }
  if (o.ls !== undefined) {
    const f = (size: number) => ({ unit: 'px', size: Math.round(o.ls! * size * 100) / 100, sizes: [] });
    Object.assign(out, rs('typography_letter_spacing', f(d), f(t), f(m)));
  }
  if (o.upper) out.typography_text_transform = 'uppercase';
  if (o.underline) out.typography_text_decoration = 'underline';
  return out;
}

/** The same settings under another control group's prefix ('typography_' → 'menu_typography_'). */
export const prefixed = (settings: Settings, from: string, to: string): Settings =>
  Object.fromEntries(Object.entries(settings).map(([k, v]) => [k.startsWith(from) ? to + k.slice(from.length) : k, v]));

// ---------- elements ----------
/**
 * A flex container. Defaults are Elementor's blanks made explicit: column,
 * no padding, no gap, no wrapping, full width.
 */
export function box_(settings: Settings, elements: El[] = [], isInner = true): El {
  return {
    id: newId(),
    elType: 'container',
    isInner,
    settings: {
      content_width: 'full',
      ...dir('column'),
      ...pad(box(0)),
      ...gap(0),
      ...wd('100%'),
      flex_wrap: 'nowrap',
      ...settings,
    },
    elements,
  };
}
export const widget = (widgetType: string, settings: Settings): El => ({ id: newId(), elType: 'widget', widgetType, settings, elements: [] });

export const heading = (title: string, tag: string, color: string, t: Settings, extra: Settings = {}) =>
  widget('heading', { title, header_size: tag, title_color: color, ...t, ...extra });
export const textEditor = (html: string, color: string, t: Settings, extra: Settings = {}) =>
  widget('text-editor', { editor: html, text_color: color, ...t, ...extra });

/** An image widget; `width` / `height` are px or % per size. */
export function pic(src: string, alt: string, o: { w?: [Len, Len, Len] | Len; h?: [Len, Len, Len] | Len; cover?: boolean; align?: string; link?: string } & Settings = {}): El {
  const { w, h, cover, align: al, link, ...rest } = o;
  const tri = (v: [Len, Len, Len] | Len): [Len, Len, Len] => (Array.isArray(v) ? v : [v, v, v]);
  return widget('image', {
    image: image(src, alt),
    image_size: 'full',
    ...(al ? rs('align', al) : { align: 'left' }),
    ...(w !== undefined ? rs('width', ...(tri(w).map(unitVal) as [Settings, Settings, Settings])) : rs('width', pct(100))),
    ...(h !== undefined ? rs('height', ...(tri(h).map(unitVal) as [Settings, Settings, Settings])) : {}),
    ...(cover ? { 'object-fit': 'cover' } : { 'object-fit': 'contain' }),
    ...(link ? { link_to: 'custom', link: { url: link, is_external: '', nofollow: '' } } : {}),
    ...rest,
  });
}

/** Figma's angled arrow as a small image (ink / navy / white), sized per breakpoint. */
export const arrow = (color: 'ink' | 'navy' | 'white', d: number, m = d, extra: Settings = {}) =>
  pic(`art-arrow-${color}.png`, '', { w: [d, d, m], h: [d, d, m], ...extra });

/**
 * A call-to-action link: a container that is one link (React: 56px tall, 20px
 * side padding, label 14/20 Demibold, 12px arrow 28px after it). Hugs its text.
 */
export function cta(label: string, url: string, bg: string, fg: string, arrowColor: 'ink' | 'navy' | 'white', external = false): El {
  return box_(
    {
      ...dir('row'),
      ...align('center'),
      ...gap(28),
      ...pad(box(0, 20)),
      ...wd('fit-content'),
      ...minH(56),
      background_background: 'classic',
      background_color: bg,
      html_tag: 'a',
      link: { url, is_external: external ? 'on' : '', nofollow: '', custom_attributes: '' },
    },
    [heading(label, 'span', fg, ty(14, 14, '600', { lh: '20px', ls: 0.01 })), arrow(arrowColor, 12)],
  );
}

/** Full-width band, content capped at 1184px (React `px-article`): 48px sides, 24px on phones. */
export function band(settings: Settings, elements: El[]): El {
  return box_(
    {
      content_width: 'boxed',
      boxed_width: px(1184),
      ...pad(box(64, 48), box(40, 48), box(40, 24)),
      ...settings,
    },
    elements,
    false,
  );
}

/** Section title used on Home and Community: 57 / 32 Demibold, lh 1.05 / 1.15, tracking −0.01em. */
export const sectionTitle = (title: string, color: string, sizes: [number, number] = [57, 32], tag = 'h2', lh: [number, number] = [1.05, 1.15]) =>
  heading(title, tag, color, ty(sizes[0], sizes[1], '600', { lh, ls: -0.01 }));

export const lines = (l: string[]) => l.join('<br>');

// ---------- Get there together (React TogetherBand.tsx) ----------
type Card = { id: string; title: { en: string }; body: { en: string }; image: { src: string; alt: string }; resourceId: string };
export interface TogetherCopy {
  title: string;
  button: { label: string; to: string };
  cardBodies: Record<string, string>;
}
/**
 * Navy band: title + green button on the left, three program cards on the right.
 * Home (title 57/32, card pictures 230px) and Community (48/45 → title 45 desktop, 48 phone,
 * 130px pictures). Desktop: row, cards side by side 6px apart. Tablet: stacked, three columns.
 * Phone: stacked, each card a row (picture 76px / 30% beside the text).
 * White title (React: sky on phones, white on desktop; Elementor has one color per widget).
 */
export function together(copy: TogetherCopy, variant: 'home' | 'community'): El {
  const cards = load('connect-cards') as Card[];
  const resources = load('resources') as { id: string; url: string; postSlug?: string }[];
  const home = variant === 'home';
  const card = (cd: Card) => {
    const r = resources.find((x) => x.id === cd.resourceId);
    if (!r) throw new Error(`connect-cards: no resource ${cd.resourceId}`);
    return box_(
      {
        ...dir('column', 'column', 'row'),
        ...wd('33%', '33%', '100%'),
        background_background: 'classic',
        background_color: '#ffffff',
        overflow: 'hidden',
        html_tag: 'a',
        // Our own guide (Bike Bus): the post on this site (relative, so staging and live both work).
        link: r.postSlug ? { url: `/${r.postSlug}/`, is_external: '', nofollow: '', custom_attributes: '' } : { url: r.url, is_external: 'on', nofollow: '', custom_attributes: '' },
      },
      [
        // The picture fills its box, whatever the card's size (a background, so it stretches with the card).
        box_({
          ...wd('100%', '100%', home ? '30%' : '22%'),
          ...minH(home ? 230 : 130, 200, home ? 131 : 110),
          background_background: 'classic',
          background_color: c('color-sky'),
          background_image: image(cd.image.src, cd.image.alt),
          background_size: 'cover',
          background_position: 'center center',
        }),
        box_(
          {
            ...gap(10),
            ...pad(box(24)),
            ...wd('100%', '100%', home ? '70%' : '78%'),
            ...justify('flex-start', 'flex-start', home ? 'flex-start' : 'center'),
            ...minH(165, 0, 0),
          },
          [
            heading(cd.title.en, 'h3', c('color-ink'), ty(28, 24, '600', { lh: 1.15, ls: -0.01 })),
            heading(copy.cardBodies[cd.id] ?? cd.body.en, 'p', c('color-navy'), ty(16, 16, '400', { lh: '24px', ls: 0.01 })),
          ],
        ),
      ],
    );
  };
  return band(
    {
      ...dir('row', 'column', 'column'),
      ...align('center', 'stretch', 'stretch'),
      ...gap(64, 24, 24),
      ...pad(box(64, 48), box(40, 48), box(40, 24)),
      background_background: 'classic',
      background_color: c('color-navy'),
    },
    [
      box_({ ...wd('38.6%', '100%', '100%'), ...gap(24), ...align('flex-start') }, [
        heading(copy.title, variant === 'home' ? 'h2' : 'h1', '#ffffff', home ? ty(57, 32, '600', { lh: [1.05, 1.15], ls: -0.01 }) : ty(45, 48, '600', { lh: 1.05, ls: -0.01 })),
        cta(copy.button.label, href(copy.button.to), c('color-leaf'), c('color-ink'), 'ink'),
      ]),
      box_({ ...dir('row', 'row', 'column'), ...gap(6, 16, 16), ...wd('56%', '100%', '100%'), ...align('stretch') }, cards.map(card)),
    ],
  );
}

// ---------- Mascot card (React MascotCard.tsx) ----------
/**
 * Big colored link card with a mascot (React `MascotCard`). Phones and tablets: a
 * row with 24px padding, the title with a 24px arrow under it on the left, a small
 * picture on the right. Desktop `stacked` (468px tall): the picture under the title,
 * a 40px arrow bottom right. Desktop `side`: title top left, arrow bottom left, the
 * picture bottom right running off the card.
 * Title sizes are [phone, desktop] as in React's `titleSize`.
 */
export function mascotCard(o: {
  title: string[];
  to: string;
  tone: 'leaf' | 'sky';
  art: string;
  layout: 'stacked' | 'side';
  titleSize?: [number, number];
  extra?: Settings;
}): El {
  const [tm, td] = o.titleSize ?? [28, 45];
  const stacked = o.layout === 'stacked';
  const title = heading(lines(o.title), 'h3', c('color-navy'), ty(td, tm, '600', { lh: [1.05, 1.15], ls: -0.01 }));
  const phoneArt = stacked
    ? pic(o.art, '', { w: 100, align: 'center', ...hide('desktop') })
    : pic(o.art, '', { w: 120, align: 'center', ...hide('desktop') });
  return box_(
    {
      ...dir('row'),
      ...justify('space-between'),
      ...gap(16),
      ...pad(box(36), box(24), box(24)),
      ...minH(stacked ? 468 : 303, 0, 0),
      overflow: 'hidden',
      background_background: 'classic',
      background_color: c(o.tone === 'leaf' ? 'color-leaf' : 'color-sky'),
      html_tag: 'a',
      link: { url: href(o.to), is_external: '', nofollow: '', custom_attributes: '' },
      ...o.extra,
    },
    [
      box_({ ...justify('space-between'), ...gap(16), ...wd(stacked ? '75%' : '100%', '60%', '60%') }, [
        title,
        ...(stacked ? [pic(o.art, '', { w: 236, ...hide('tablet', 'mobile') }), arrow('navy', 40, 24, hide('desktop'))] : [arrow('navy', 40, 24)]),
      ]),
      // Phones: the small mascot on the right. Stacked desktop: the arrow at the bottom right.
      // Side desktop: the card is one column and the mascot sits on its bottom right edge.
      box_({ ...align('flex-end', 'center', 'center'), ...justify('flex-end', 'center', 'center'), ...wd('25%', '40%', '40%'), ...(stacked ? {} : hide('desktop')) }, [
        phoneArt,
        ...(stacked ? [arrow('navy', 40, 24, hide('tablet', 'mobile'))] : []),
      ]),
      ...(stacked
        ? []
        : [
            pic(o.art, '', {
              w: 310,
              _position: 'absolute',
              _offset_orientation_h: 'end',
              _offset_x_end: px(-80),
              _offset_orientation_v: 'end',
              _offset_y_end: px(36),
              ...hide('tablet', 'mobile'),
            }),
          ]),
    ],
  );
}

// ---------- writing ----------
/** Writes wordpress/elementor/<file> as an Elementor template export (version 0.4). */
export function writeTemplate(file: string, title: string, type: string, content: El[], pageSettings?: Settings) {
  mkdirSync(OUT_DIR, { recursive: true });
  const t = { version: '0.4', title, type, ...(pageSettings ? { page_settings: pageSettings } : {}), content };
  writeFileSync(join(OUT_DIR, file), JSON.stringify(t, null, 1) + '\n');
  console.log(`wordpress/elementor/${file}  ${title}`);
}
/** Page templates: Elementor Full Width, no theme page title. */
export const FULL_WIDTH = { template: 'elementor_header_footer', hide_title: 'yes' };
