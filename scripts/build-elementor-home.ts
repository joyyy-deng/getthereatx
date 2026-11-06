// npm run build:elementor -- --images=https://…/images
// Builds wordpress/elementor/home.json: the Home page as an Elementor page
// template (Templates → Saved Templates → Import Templates), made only of
// containers and classic widgets (Heading, Text Editor, Button, Image, Nested
// Accordion) so staff can edit every word and image in Elementor.
//
// Wording, links and colors come from the same content files as the site
// (pages.json, theme.json, connect-cards.json, posts.json, resources.json), so
// after a design or copy change, run this again and re-import.
//
// Images: Elementor's importer downloads each image from its URL into the
// site's Media Library, so --images must be a web address the WordPress site
// can reach. The images it needs are copied to wordpress/elementor/images/.
//
// Colors and fonts are set on each widget (not Elementor's global Site
// Settings), so importing never changes anything else on the site.

import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { load } from './content';

const ROOT = join(import.meta.dirname, '..');
const OUT_DIR = join(ROOT, 'wordpress', 'elementor');
const IMG_DIR = join(OUT_DIR, 'images');

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=').slice(1).join('=');
const IMAGES = (arg('images') ?? '').replace(/\/$/, '');
if (!IMAGES) {
  console.error('Usage: npm run build:elementor -- --images=<web address of wordpress/elementor/images>');
  process.exit(1);
}
/** WordPress page addresses (same defaults as the gtatx-tools plugin). */
const PAGES = { plan: '/plan-your-trip/', community: '/community/', resources: '/resources/' };

// ---------- content ----------
type L = { en: string };
const pages = load('pages') as { home: HomeCopy };
const theme = load('theme') as { colors: Record<string, { value: string }> };
const cards = load('connect-cards') as { id: string; title: L; body: L; image: { src: string; alt: string }; resourceId: string }[];
const posts = load('posts') as { slug: string; url: string; summary: L; image?: { src: string; alt: string } }[];
const resources = load('resources') as { id: string; url: string; action: string; oneLiner: string }[];

interface HomeCopy {
  hero: { title: string[]; planTitle: string; button: string; illustrationAlt: string };
  guides: {
    title: string[];
    seeAll: { title: string[]; to: string };
    items: { id: string; title: string; postSlug?: string; resourceId?: string; body?: string; image?: { src: string; alt: string }; linkLabel?: string }[];
  };
  discover: { title: string; cards: { title: string; image: { src: string; alt: string }; to: string }[]; explore: { title: string[]; to: string } };
  together: { title: string; button: { label: string; to: string } };
}
const home = pages.home;
const c = (name: string) => theme.colors[name].value;

// ---------- helpers ----------
const FONT = 'ff-real-text-pro';
const id = () => randomBytes(4).toString('hex').slice(0, 7);
const px = (size: number) => ({ unit: 'px', size, sizes: [] });
const box = (top: number, right = top, bottom = top, left = right) => ({
  unit: 'px',
  top: String(top),
  right: String(right),
  bottom: String(bottom),
  left: String(left),
  isLinked: top === right && right === bottom && bottom === left,
});
const gap = (n: number) => ({ column: String(n), row: String(n), isLinked: true, unit: 'px', size: n });

/** Prototype route (/plan, /community#events) → WordPress page address. */
function href(to: string): string {
  const [path, rest = ''] = to.split(/(?=[?#])/);
  const map: Record<string, string> = { '/plan': PAGES.plan, '/community': PAGES.community, '/resources': PAGES.resources };
  return (map[path] ?? path) + rest;
}

const copied = new Set<string>();
/** Copy a /public image (or a wordpress/elementor/images one) and return its web address. */
function image(src: string, alt: string) {
  const name = basename(src);
  if (!copied.has(name) && src.startsWith('/')) {
    mkdirSync(IMG_DIR, { recursive: true });
    copyFileSync(join(ROOT, 'public', src), join(IMG_DIR, name));
  }
  copied.add(name);
  return { url: `${IMAGES}/${name}`, id: '', alt, source: 'library' };
}

type Settings = Record<string, unknown>;
type El = { id: string; elType: string; settings: Settings; elements: El[]; isInner?: boolean; widgetType?: string };

const container = (settings: Settings, elements: El[], isInner = true): El => ({
  id: id(),
  elType: 'container',
  isInner,
  settings: { content_width: 'full', ...settings },
  elements,
});
const widget = (widgetType: string, settings: Settings): El => ({ id: id(), elType: 'widget', widgetType, settings, elements: [] });

/** Typography for a size on desktop / phone. */
function type(desktop: number, phone: number, weight: string, opts: { lh?: number; ls?: number } = {}) {
  return {
    typography_typography: 'custom',
    typography_font_family: FONT,
    typography_font_weight: weight,
    typography_font_size: px(desktop),
    typography_font_size_tablet: px(Math.round((desktop + phone) / 2)),
    typography_font_size_mobile: px(phone),
    ...(opts.lh ? { typography_line_height: { unit: 'em', size: opts.lh, sizes: [] } } : {}),
    ...(opts.ls !== undefined ? { typography_letter_spacing: { unit: 'px', size: opts.ls, sizes: [] } } : {}),
  };
}

const heading = (title: string, tag: string, color: string, t: Settings, extra: Settings = {}) =>
  widget('heading', { title, header_size: tag, title_color: color, ...t, ...extra });

const textEditor = (html: string, color: string, t: Settings) => widget('text-editor', { editor: html, text_color: color, ...t });

function button(text: string, url: string, colors: { bg: string; fg: string }, external = false) {
  return widget('button', {
    text,
    link: { url, is_external: external ? 'on' : '', nofollow: '', custom_attributes: '' },
    background_color: colors.bg,
    button_text_color: colors.fg,
    hover_color: colors.fg,
    button_background_hover_color: colors.bg,
    border_radius: box(0),
    text_padding: box(18, 22),
    ...type(16, 14, '700'),
  });
}

const img = (src: string, alt: string, extra: Settings = {}) =>
  widget('image', { image: image(src, alt), image_size: 'full', align: 'left', width: { unit: '%', size: 100, sizes: [] }, ...extra });

/** Full-width band with content capped at 1200px, like the site's page margin. */
const band = (settings: Settings, elements: El[]) =>
  container(
    {
      content_width: 'boxed',
      boxed_width: px(1200),
      flex_direction: 'column',
      padding: box(64, 48),
      padding_tablet: box(48, 40),
      padding_mobile: box(40, 24),
      ...settings,
    },
    elements,
    false,
  );

const lines = (l: string[]) => l.join('<br>');
const arrowText = (s: string, external = false) => `${s} ${external ? '↗' : '→'}`;

// ---------- 1. Masthead ----------
// The From / To form is part of the trip planner tool (plugin), so here the
// card is its heading plus a button to the Plan Your Trip page.
const masthead = band({ flex_direction: 'row', flex_direction_mobile: 'column', flex_align_items: 'flex-end', flex_gap: gap(40), border_border: 'solid', border_width: box(0, 0, 1, 0), border_color: c('color-navy') }, [
  container({ flex_direction: 'column', width: { unit: '%', size: 56 }, width_mobile: { unit: '%', size: 100 }, flex_gap: gap(24) }, [
    heading(lines(home.hero.title), 'h1', c('color-ink'), type(96, 48, '700', { lh: 0.98, ls: -1.4 })),
    container(
      {
        flex_direction: 'column',
        flex_gap: gap(20),
        background_background: 'classic',
        background_color: c('color-sky'),
        border_radius: { unit: 'px', top: '0', right: '37', bottom: '0', left: '0', isLinked: false },
        padding: box(24, 24, 28, 24),
      },
      [
        heading(home.hero.planTitle, 'h2', c('color-navy'), type(40, 28, '700', { lh: 1.05, ls: -1 })),
        button(arrowText(home.hero.button), PAGES.plan, { bg: c('color-navy'), fg: c('color-bg') }),
      ],
    ),
  ]),
  container({ flex_direction: 'column', width: { unit: '%', size: 44 }, width_mobile: { unit: '%', size: 100 } }, [
    img('capitol-bus.png', home.hero.illustrationAlt, { align: 'right' }),
  ]),
]);

// ---------- 2. New to this? ----------
const guideItems = home.guides.items.map((item) => {
  const post = item.postSlug ? posts.find((p) => p.slug === item.postSlug) : undefined;
  const r = item.resourceId ? resources.find((x) => x.id === item.resourceId) : undefined;
  const body = item.body ?? post?.summary.en ?? r?.oneLiner ?? '';
  const pic = item.image ?? post?.image;
  const link = post ? { url: post.url, label: item.linkLabel ?? 'Read the guide' } : { url: r!.url, label: item.linkLabel ?? r!.action };
  return {
    title: item.title,
    content: container({ flex_direction: 'column', flex_gap: gap(16), background_background: 'classic', background_color: c('color-sky'), padding: box(24), padding_mobile: box(16) }, [
      ...(pic ? [img(pic.src, pic.alt, { height: px(180), object_fit: 'cover' })] : []),
      textEditor(`<p>${body}</p>`, c('color-navy'), type(19, 17, '400', { lh: 1.4 })),
      textEditor(`<p><a href="${link.url}" target="_blank" rel="noopener">${arrowText(link.label, true)}</a></p>`, c('color-link'), type(14, 13, '400')),
    ]),
  };
});
const accordion: El = {
  id: id(),
  elType: 'widget',
  widgetType: 'nested-accordion',
  settings: {
    items: guideItems.map((g) => ({ item_title: g.title, _id: id(), element_css_id: '' })),
    default_state: 'expanded',
    max_items_expended: 'one',
    title_tag: 'h3',
    accordion_item_title_space_between: px(0),
    accordion_border_width: box(1, 0, 0, 0),
    accordion_border_color: c('color-rule'),
    accordion_padding: box(20, 0, 20, 16),
    normal_title_color: c('color-ink'),
    title_typography_typography: 'custom',
    title_typography_font_family: FONT,
    title_typography_font_weight: '500',
    title_typography_font_size: px(22),
    title_typography_font_size_mobile: px(20),
  },
  elements: guideItems.map((g) => g.content),
};
const seeAll = container(
  {
    flex_direction: 'column',
    flex_justify_content: 'space-between',
    min_height: px(420),
    min_height_mobile: px(250),
    padding: box(36),
    padding_mobile: box(24),
    background_background: 'classic',
    background_color: c('color-leaf'),
    html_tag: 'a',
    link: { url: href(home.guides.seeAll.to), is_external: '', nofollow: '' },
  },
  [
    heading(lines(home.guides.seeAll.title), 'h3', c('color-bg'), type(40, 28, '600', { lh: 1.05 })),
    img('guides-kangaroo.png', '', { width: { unit: 'px', size: 236, sizes: [] }, width_mobile: { unit: 'px', size: 150, sizes: [] } }),
  ],
);
const guides = band({ flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap(64) }, [
  container({ flex_direction: 'column', width: { unit: '%', size: 28 }, width_mobile: { unit: '%', size: 100 }, flex_gap: gap(24) }, [
    heading(lines(home.guides.title), 'h2', c('color-ink'), type(52, 32, '600', { lh: 1.02, ls: -1.5 })),
    seeAll,
  ]),
  container({ flex_direction: 'column', width: { unit: '%', size: 72 }, width_mobile: { unit: '%', size: 100 } }, [accordion]),
]);

// ---------- 3. See what's going on ----------
const photoCard = (card: HomeCopy['discover']['cards'][number]) =>
  container(
    {
      flex_direction: 'column',
      flex_justify_content: 'flex-end',
      min_height: px(218),
      min_height_mobile: px(200),
      padding: box(16),
      background_background: 'classic',
      background_image: image(card.image.src, card.image.alt),
      background_size: 'cover',
      background_position: 'center center',
      background_overlay_background: 'gradient',
      background_overlay_color: 'rgba(0,0,0,0)',
      background_overlay_color_b: 'rgba(0,0,0,0.7)',
      background_overlay_gradient_type: 'linear',
      background_overlay_gradient_angle: { unit: 'deg', size: 180, sizes: [] },
      background_overlay_color_stop: { unit: '%', size: 45, sizes: [] },
      html_tag: 'a',
      link: { url: href(card.to), is_external: '', nofollow: '' },
    },
    [heading(arrowText(card.title), 'h3', '#ffffff', type(28, 22, '700', { ls: -0.8 }))],
  );
const exploreMore = container(
  {
    flex_direction: 'column',
    flex_justify_content: 'space-between',
    width: { unit: '%', size: 36 },
    width_mobile: { unit: '%', size: 100 },
    padding: box(36),
    padding_mobile: box(24),
    background_background: 'classic',
    background_color: c('color-sky-strong'),
    html_tag: 'a',
    link: { url: href(home.discover.explore.to), is_external: '', nofollow: '' },
  },
  [
    heading(arrowText(lines(home.discover.explore.title)), 'h3', c('color-navy'), type(40, 28, '700', { lh: 1.05 })),
    img('austin-dog.png', '', { align: 'right', width: { unit: 'px', size: 220, sizes: [] } }),
  ],
);
const discover = band({ flex_gap: gap(40), border_border: 'solid', border_width: box(1, 0, 1, 0), border_color: c('color-rule') }, [
  heading(home.discover.title, 'h2', c('color-ink'), type(52, 32, '600', { lh: 1.02, ls: -1.5 })),
  container({ flex_direction: 'row', flex_direction_mobile: 'column', flex_gap: gap(40) }, [
    container({ flex_direction: 'column', width: { unit: '%', size: 64 }, width_mobile: { unit: '%', size: 100 }, flex_gap: gap(32) }, home.discover.cards.map(photoCard)),
    exploreMore,
  ]),
]);

// ---------- 4. Get there together ----------
const categoryCard = (card: (typeof cards)[number]) => {
  const r = resources.find((x) => x.id === card.resourceId)!;
  return container(
    {
      flex_direction: 'column',
      width: { unit: '%', size: 33 },
      width_mobile: { unit: '%', size: 100 },
      background_background: 'classic',
      background_color: c('color-mist'),
      border_border: 'solid',
      border_width: box(1),
      border_color: c('color-sky'),
      html_tag: 'a',
      link: { url: r.url, is_external: 'on', nofollow: '' },
    },
    [
      img(card.image.src, card.image.alt, { height: px(200), object_fit: 'cover' }),
      container({ flex_direction: 'column', flex_gap: gap(10), padding: box(24) }, [
        heading(card.title.en, 'h3', c('color-ink'), type(26, 22, '700', { lh: 1.1, ls: -0.8 })),
        textEditor(`<p>${arrowText(card.body.en, true)}</p>`, c('color-navy'), type(17, 15, '400')),
      ]),
    ],
  );
};
const together = band({ flex_direction: 'row', flex_direction_mobile: 'column', flex_align_items: 'center', flex_gap: gap(64), background_background: 'classic', background_color: c('color-navy') }, [
  container({ flex_direction: 'column', width: { unit: '%', size: 32 }, width_mobile: { unit: '%', size: 100 }, flex_gap: gap(24), flex_align_items: 'flex-start' }, [
    heading(home.together.title, 'h2', c('color-mist'), type(52, 32, '600', { lh: 1.02, ls: -1.5 })),
    button(arrowText(home.together.button.label), href(home.together.button.to), { bg: c('color-leaf'), fg: c('color-ink') }),
  ]),
  container({ flex_direction: 'row', flex_direction_mobile: 'column', width: { unit: '%', size: 68 }, width_mobile: { unit: '%', size: 100 }, flex_gap: gap(6) }, cards.map(categoryCard)),
]);

// ---------- write ----------
const template = {
  version: '0.4',
  title: '[WKRM] Sample Home',
  type: 'page',
  // Elementor Full Width page layout, no theme page title.
  page_settings: { template: 'elementor_header_footer', hide_title: 'yes' },
  content: [masthead, guides, discover, together],
};
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'home.json'), JSON.stringify(template, null, 1) + '\n');
console.log(`wordpress/elementor/home.json: ${template.content.length} sections; ${copied.size} images in wordpress/elementor/images/ (served from ${IMAGES})`);
