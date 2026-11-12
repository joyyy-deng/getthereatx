// npm run build:elementor:templates -- --images=https://…/images
// Builds the Elementor templates for blog posts and community events into
// wordpress/elementor/, from the Figma frames ("Article/blog Master template"
// 980:1883 / 981:2335 and "Community Event Detail Template" 1014:2549 / 1015:277).
//
//   blog-starter.json            [WKRM] Blog post starter: every body block in Figma order,
//                                with Figma's placeholder text. Option A: insert it into a
//                                new post, type over the text, delete blocks you don't need.
//   block-*.json                 One saved template per block, to add a block again later.
//   single-post.json             [WKRM] Blog post (Theme Builder, Single Post; Elementor Pro).
//   single-event.json            [WKRM] Community event (Theme Builder, Single; Elementor Pro).
//   loop-item-related-card.json  [WKRM] Related card (Loop Item; Elementor Pro).
//   loop-item-event-card.json    [WKRM] Event card (Loop Item; Elementor Pro).
//
// Only normal Elementor widgets (Container, Heading, Text Editor, Button,
// Image, Video, Post Title/Excerpt/Content/Featured Image, Loop Grid). Sizes and
// colors are set on each widget from Figma and theme.json; nothing touches the
// site's global settings. Wording comes from pages.json, like the prototype.
//
// The Loop Grids point at their Loop Item by id, which only exists after
// import: the files say __LOOP_RELATED__ / __LOOP_EVENT__ and
// wordpress/local-dev/seed.sh swaps in the real ids (on the live site, pick the
// card in the Loop Grid's "Choose a template" after importing).

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
  console.error('Usage: npm run build:elementor:templates -- --images=<web address of wordpress/elementor/images>');
  process.exit(1);
}
const PAGES = { plan: '/plan-your-trip/', community: '/community/#events', resources: '/resources/?type=guides#directory' };

// ---------- content ----------
type GuideCopy = { backLabel: string; tipLabel: string; relatedTitle: string; cta: { title: string; text: string; button: string } };
type EventCopy = {
  backLabel: string; bringTitle: string; hostedTitle: string; accessibilityTitle: string; gettingThereTitle: string;
  labels: Record<'date' | 'time' | 'location' | 'cost' | 'ages' | 'registration', string>;
  bookButton: string; calendarButton: string; moreTitle: string; viewEvent: string;
};
const pages = load('pages') as { guide: GuideCopy; event: EventCopy };
const theme = load('theme') as { colors: Record<string, { value: string }> };
const c = (name: string) => theme.colors[name].value;
const G = pages.guide;
const E = pages.event;

// ---------- Elementor helpers ----------
const FONT = 'ff-real-text-pro';
const id = () => randomBytes(4).toString('hex').slice(0, 7);
const px = (size: number) => ({ unit: 'px', size, sizes: [] });
const box = (top: number, right = top, bottom = top, left = right) => ({
  unit: 'px', top: String(top), right: String(right), bottom: String(bottom), left: String(left),
  isLinked: top === right && right === bottom && bottom === left,
});
const gap = (n: number) => ({ column: String(n), row: String(n), isLinked: true, unit: 'px', size: n });

type Settings = Record<string, unknown>;
type El = { id: string; elType: string; settings: Settings; elements: El[]; isInner?: boolean; widgetType?: string };

const container = (settings: Settings, elements: El[], isInner = true): El => ({
  id: id(), elType: 'container', isInner, settings: { content_width: 'full', flex_direction: 'column', padding: box(0), ...settings }, elements,
});
const widget = (widgetType: string, settings: Settings): El => ({ id: id(), elType: 'widget', widgetType, settings, elements: [] });

/** Typography: desktop size (tablet = desktop, Figma's ≥768 rule) and phone size. */
function type(desktop: number, phone: number, weight: string, opts: { lh?: number | 'normal'; ls?: number; upper?: boolean } = {}) {
  return {
    typography_typography: 'custom',
    typography_font_family: FONT,
    typography_font_weight: weight,
    typography_font_size: px(desktop),
    typography_font_size_tablet: px(desktop),
    typography_font_size_mobile: px(phone),
    ...(typeof opts.lh === 'number' ? { typography_line_height: { unit: 'em', size: opts.lh, sizes: [] } } : {}),
    ...(opts.ls !== undefined ? { typography_letter_spacing: { unit: 'px', size: opts.ls, sizes: [] } } : {}),
    ...(opts.upper ? { typography_text_transform: 'uppercase' } : {}),
  };
}

/** A dynamic tag, as Elementor stores it. */
const tag = (name: string, settings: Settings = {}) =>
  `[elementor-tag id="${id()}" name="${name}" settings="${encodeURIComponent(JSON.stringify(settings))}"]`;
const gtText = (field: string) => tag('gtatx-text', { field });
const gtUrl = (field: string) => tag('gtatx-url', { field });

const heading = (title: string, tag_: string, color: string, t: Settings, extra: Settings = {}) =>
  widget('heading', { title, header_size: tag_, title_color: color, ...t, ...extra });
const text = (html: string, color: string, t: Settings, extra: Settings = {}) => widget('text-editor', { editor: html, text_color: color, ...t, ...extra });

/** Figma buttons: 16px bold, 16/20 padding, the arrow added by blog.css (.gtatx-arrow). */
function button(label: string, url: string, tone: 'green' | 'black' | 'outline', extra: Settings = {}, external = false) {
  const colors = { green: [c('color-leaf'), c('color-ink')], black: [c('color-ink'), '#FFFFFF'], outline: ['#FFFFFF', c('color-ink')] }[tone];
  return widget('button', {
    text: label,
    link: { url, is_external: external ? 'on' : '', nofollow: '', custom_attributes: '' },
    background_color: colors[0],
    button_text_color: colors[1],
    hover_color: colors[1],
    button_background_hover_color: colors[0],
    border_radius: box(0),
    text_padding: box(16, 20),
    ...(tone === 'outline' ? { border_border: 'solid', border_width: box(2), border_color: c('color-ink') } : {}),
    ...type(16, 16, '700'),
    _css_classes: `gtatx-arrow${tone === 'black' ? ' gtatx-arrow-light' : ''}`,
    ...extra,
  });
}

const copied = new Set<string>();
function image(src: string, alt: string) {
  const name = basename(src);
  if (!copied.has(name)) {
    mkdirSync(IMG_DIR, { recursive: true });
    copyFileSync(join(ROOT, 'public', src), join(IMG_DIR, name));
  }
  copied.add(name);
  return { url: `${IMAGES}/${name}`, id: '', alt, source: 'library' };
}

/** The page column: 1184px wide, 128px margins at 1440 (Figma), 48px tablets, 24px phones. */
const column = (settings: Settings, elements: El[]) =>
  container(
    { content_width: 'boxed', boxed_width: px(1184), padding: box(0, 48), padding_mobile: box(0, 24), ...settings },
    elements,
  );

/** Eyebrow / label text: caps, tracked. */
const caps = (title: string, size: number, tag_ = 'p', extra: Settings = {}) =>
  heading(title, tag_, c('color-ink-soft'), type(size, size, '400', { ls: size * 0.117, upper: true, lh: 'normal' }), extra);

// ---------- blog body blocks (Option A) ----------
const h2 = (title: string) =>
  container({ padding: box(24, 0, 0, 0), padding_mobile: box(8, 0, 0, 0) }, [
    heading(title, 'h2', c('color-ink'), type(32, 32, '700', { lh: 1.1, ls: -0.96 })),
  ]);
const paragraph = (words: string) => text(`<p>${words}</p>`, c('color-charcoal'), type(18, 18, '400', { lh: 1.6 }));

const blocks = {
  facts: () =>
    widget('gtatx-facts', {
      facts: [
        ['Stations', '75+ across Austin'],
        ['Hours', 'Open 24/7'],
        ['Bikes', '100% electric'],
      ].map(([label, value]) => ({ _id: id(), label, value })),
    }),
  heading: () => h2('Section heading'),
  paragraph: () => paragraph('Body paragraph. Keep it short and friendly, with one idea per paragraph so people can scan it quickly. Explain unfamiliar words the first time you use them.'),
  tip: () =>
    container(
      {
        flex_gap: gap(6), padding: box(20, 24),
        background_background: 'classic', background_color: c('color-mist'),
        border_border: 'solid', border_width: box(0, 0, 0, 4), border_color: c('color-navy'),
      },
      [
        caps(G.tipLabel, 12),
        text('<p>A helpful reminder, safety note, or insider tip that is worth pulling out of the main text.</p>', c('color-ink'), type(16, 16, '400', { lh: 1.5 })),
      ],
    ),
  // Steps, Facts and Table are our plugin's Elementor widgets (GetThereATX group): staff add, remove and
  // reorder items in the left panel; the layout comes from css/blog.css.
  steps: () =>
    widget('gtatx-steps', {
      steps: [
        ['Find a station', 'Open the map or app to see nearby bikes and open docks.'],
        ['Unlock a bike', 'Scan the code or enter your account details at the dock.'],
        ['Ride to your stop', 'Use bike lanes and trails when you can, and follow traffic signals.'],
        ['Return it', 'Dock the bike at any open station and check that it locked.'],
      ].map(([title, text_]) => ({ _id: id(), title, text: text_ })),
    }),
  // Figma's media box (sky, up to 400px tall). The picture is never stretched or enlarged (css .gtatx-media).
  image: () =>
    container({ background_background: 'classic', background_color: c('color-sky'), flex_align_items: 'center' }, [
      widget('image', {
        image: image('/images/home/first-bus-ride.jpg', 'Describe the picture for people who can’t see it'),
        image_size: 'full',
        align: 'center',
        'object-fit': 'contain',
        _css_classes: 'gtatx-media',
      }),
    ]),
  caption: () =>
    text('<p>Caption describing the image</p>', c('color-ink-soft'), type(13, 13, '400', { lh: 'normal' })),
  table: () =>
    widget('gtatx-table', {
      columns: '3',
      heading_1: 'Column one',
      heading_2: 'Column two',
      heading_3: 'Column three',
      heading_4: '',
      rows: [1, 2, 3].map(() => ({ _id: id(), cell_1: 'Row label', cell_2: 'Detail text', cell_3: 'Detail text', cell_4: '' })),
    }),
  button: () =>
    container({ padding: box(8, 0, 0, 0), flex_align_items: 'flex-start', flex_align_items_mobile: 'stretch' }, [
      button('Primary action', '#', 'green', { _css_classes: 'gtatx-arrow gtatx-arrow-spread', align_mobile: 'justify' }),
    ]),
};

/** The body as Figma lays it out: 32px apart (24 on phones). */
/**
 * Each block carries its own space below it (Figma: 32px, 24px on phones), so
 * a block looks right wherever staff drop it: in the starter, on its own, or
 * next to a widget they added. The column around them adds no gap.
 */
function spaced(el: El): El {
  const key = el.elType === 'widget' ? '_margin' : 'margin';
  el.settings[key] = box(0, 0, 32, 0);
  el.settings[`${key}_mobile`] = box(0, 0, 24, 0);
  return el;
}
const bodyColumn = (elements: El[]) => container({ flex_gap: gap(0) }, elements.map(spaced));

/** Image + caption, 12px apart, as one block. */
const figure = () => container({ flex_gap: gap(12) }, [blocks.image(), blocks.caption()]);

const starter = bodyColumn([
  blocks.facts(), blocks.heading(), blocks.paragraph(), blocks.tip(),
  h2('How it works'), blocks.steps(), figure(), blocks.heading(), blocks.table(), blocks.button(),
]);

// ---------- shared template parts ----------
const hero = (inner: El, extra: Settings = {}) =>
  container({ height: px(360), height_mobile: px(200), min_height: px(360), min_height_mobile: px(200), background_background: 'classic', background_color: c('color-sky'), flex_justify_content: 'center', flex_align_items: 'center', overflow: 'hidden', padding: box(0), ...extra }, [inner]);

const featuredImage = () =>
  widget('theme-post-featured-image', {
    width: { unit: '%', size: 100, sizes: [] },
    height: px(360), height_mobile: px(200), 'object-fit': 'cover', image_size: 'full',
  });

const backLink = (label: string, url: string, extra: Settings = {}) =>
  widget('button', {
    text: label,
    link: { url, is_external: '', nofollow: '', custom_attributes: '' },
    background_color: 'transparent', button_background_hover_color: 'transparent',
    button_text_color: c('color-ink'), hover_color: c('color-ink'),
    text_padding: box(0), border_radius: box(0),
    ...type(14, 14, '600', { lh: 'normal' }),
    _css_classes: 'gtatx-back-link',
    ...extra,
  });

const sectionTitle = (title: string, desktop: number, weight: string, color = c('color-ink')) =>
  heading(title, 'h2', color, type(desktop, 32, weight, { lh: 1.06, ls: -desktop * 0.045 }));

const loopGrid = (templateKey: string, queryId: string, postType: string) =>
  widget('loop-grid', {
    template_id: templateKey,
    columns: '3', columns_tablet: '3', columns_mobile: '1',
    posts_per_page: 3,
    column_gap: px(24), row_gap: px(24), row_gap_mobile: px(16),
    post_query_post_type: postType,
    post_query_posts_per_page: 3,
    post_query_query_id: queryId,
    pagination_type: '',
  });

// ---------- Single Post (blog) ----------
const singlePost = container(
  { _css_classes: 'gtatx-blog', padding: box(0), flex_gap: gap(0) },
  [
    hero(featuredImage(), { _css_classes: 'gtatx-if-no_hero_video' }),
    hero(
      widget('video', {
        video_type: 'youtube',
        youtube_url: '',
        __dynamic__: { youtube_url: tag('acf-url', { key: 'field_gtatx_hero_video:gtatx_hero_video' }) },
        aspect_ratio: '169',
        yt_privacy: 'yes',
        rel: '',
        _element_width: 'initial',
        _element_custom_width: { unit: '%', size: 100 },
      }),
      { _css_classes: 'gtatx-if-hero_video' },
    ),
    column({ padding: box(40, 48, 56, 48), padding_mobile: box(24) }, [
      backLink(G.backLabel, PAGES.resources, { hide_mobile: 'hidden-mobile' }),
      container({ flex_gap: gap(20), flex_gap_mobile: gap(16) }, [
        widget('spacer', { space: px(15) }), // Figma's removed eyebrow line
        widget('theme-post-title', { header_size: 'h1', title_color: c('color-ink'), ...type(72, 44, '700', { lh: 0.98, ls: -2.88 }) }),
        widget('theme-post-excerpt', { text_color: c('color-ink-soft'), ...type(22, 17, '400', { lh: 1.45 }), _element_width: 'initial', _element_custom_width: px(760), _element_custom_width_mobile: { unit: '%', size: 100 } }),
        heading('', 'p', c('color-ink-soft'), type(14, 13, '400', { lh: 'normal' }), { __dynamic__: { title: gtText('blog_meta') } }),
      ]),
    ]),
    column({ padding: box(16, 48, 64, 48), padding_mobile: box(0, 24, 32, 24) }, [
      widget('theme-post-content', { text_color: c('color-charcoal'), ...type(18, 18, '400', { lh: 1.6 }) }),
    ]),
    column(
      {
        _css_classes: 'gtatx-if-related', flex_gap: gap(40), flex_gap_mobile: gap(24),
        padding: box(80, 48), padding_mobile: box(40, 24),
        border_border: 'solid', border_width: box(1, 0, 0, 0), border_color: c('color-sky'),
      },
      [sectionTitle(G.relatedTitle, 42, '500'), loopGrid('__LOOP_RELATED__', 'gtatx_related_posts', 'post')],
    ),
    column({ padding: box(0, 48, 80, 48), padding_mobile: box(0, 24, 40, 24) }, [
      container(
        {
          flex_direction: 'row', flex_direction_tablet: 'column', flex_direction_mobile: 'column',
          flex_align_items: 'center', flex_align_items_tablet: 'stretch',
          flex_gap: gap(48), flex_gap_tablet: gap(24),
          padding: box(56), padding_tablet: box(32, 24), padding_mobile: box(32, 24),
          background_background: 'classic', background_color: c('color-leaf-deep'),
        },
        [
          container({ flex_gap: gap(20), flex_grow: 1, flex_shrink: 1, flex_align_items: 'flex-start', flex_align_items_mobile: 'stretch' }, [
            // Navy, not Figma's white: white on #63ac56 is 2.8:1 (fails WCAG).
            heading(G.cta.title, 'h2', c('color-navy'), type(52, 36, '700', { lh: 1, ls: -2.08 })),
            text(`<p>${G.cta.text}</p>`, c('color-navy'), type(18, 16, '400', { lh: 1.45 })),
            button(G.cta.button, PAGES.plan, 'black', { _css_classes: 'gtatx-arrow gtatx-arrow-light gtatx-arrow-spread', align_mobile: 'justify' }),
          ]),
          container(
            {
              width: px(320), width_tablet: { unit: '%', size: 100 }, min_height: px(240), min_height_tablet: px(160),
              flex_shrink: 0, flex_justify_content: 'center', flex_align_items: 'center', padding: box(16),
              background_background: 'classic', background_color: c('color-sky'),
            },
            [widget('image', { image: image('/images/mascots/guides-kangaroo.svg', ''), image_size: 'full', height: px(208), height_tablet: px(128), 'object-fit': 'contain' })],
          ),
        ],
      ),
    ]),
  ],
  false,
);

/** Figma "Article/Related card" as a Loop Item: the whole card links to the post. */
const card = (eyebrow: string, action: string, imageHeight: [number, number]) =>
  container(
    {
      html_tag: 'a', link: { url: '', is_external: '', nofollow: '' }, __dynamic__: { link: tag('post-url') },
      background_background: 'classic', background_color: c('color-mist'), padding: box(0), flex_gap: gap(0), min_height: { unit: '%', size: 100 },
    },
    [
      widget('theme-post-featured-image', { height: px(imageHeight[0]), height_mobile: px(imageHeight[1]), 'object-fit': 'cover', width: { unit: '%', size: 100, sizes: [] }, image_size: 'medium_large' }),
      container({ padding: box(24), flex_gap: gap(10), flex_grow: 1 }, [
        caps('', 12, 'p', { __dynamic__: { title: eyebrow } }),
        widget('theme-post-title', { header_size: 'h3', title_color: c('color-ink'), ...type(24, 24, '500', { lh: 1.1, ls: -0.48 }) }),
        heading(action, 'p', c('color-ink'), type(14, 14, '600', { lh: 'normal' }), { _css_classes: 'gtatx-arrow', align: 'right', _margin: { unit: 'px', top: 'auto', right: '0', bottom: '0', left: '0', isLinked: false } }),
      ]),
    ],
    false,
  );

// ---------- Single (event) ----------
const section = (title: string, cls: string, elements: El[]) =>
  container({ _css_classes: `gtatx-if-${cls}`, flex_gap: gap(16) }, [
    heading(title, 'h2', c('color-ink'), type(32, 26, '700', { lh: 1.1, ls: -0.96 })),
    ...elements,
  ]);
const body18 = (field: string, extra: Settings = {}) =>
  text('', c('color-charcoal'), type(18, 18, '400', { lh: 1.6 }), { __dynamic__: { editor: gtText(field) }, ...extra });
const eventFact = (label: string, field: string, cls?: string) =>
  container({ flex_gap: gap(4), ...(cls ? { _css_classes: `gtatx-if-${cls}` } : {}) }, [
    caps(label, 11),
    heading('', 'p', c('color-ink'), type(22, 22, '700', { ls: -0.44, lh: 'normal' }), { __dynamic__: { title: gtText(field) } }),
  ]);

const singleEvent = container(
  { _css_classes: 'gtatx-blog gtatx-event', padding: box(0), flex_gap: gap(0) },
  [
    hero(featuredImage()),
    column({ padding: box(40, 48, 30, 48), padding_mobile: box(24), flex_gap: gap(59), flex_gap_mobile: gap(20) }, [
      backLink(E.backLabel, PAGES.community),
      container({ flex_gap: gap(20), flex_gap_mobile: gap(12) }, [
        widget('theme-post-title', { header_size: 'h1', title_color: c('color-ink'), ...type(72, 40, '700', { lh: 1.1, ls: -2.88 }) }),
        widget('theme-post-excerpt', { text_color: c('color-ink-soft'), ...type(22, 18, '400', { lh: 1.45 }), _element_width: 'initial', _element_custom_width: px(760), _element_custom_width_mobile: { unit: '%', size: 100 } }),
      ]),
    ]),
    // Desktop: sections left, details card right, 80px apart. Tablet and phone: the card first.
    column(
      {
        flex_direction: 'row', flex_direction_tablet: 'column-reverse', flex_direction_mobile: 'column-reverse',
        flex_align_items: 'flex-start', flex_align_items_tablet: 'stretch',
        flex_gap: gap(80), flex_gap_tablet: gap(32),
        padding: box(16, 48, 64, 48), padding_mobile: box(0, 24, 40, 24),
      },
      [
        container({ flex_gap: gap(48), flex_gap_tablet: gap(40), flex_grow: 1, flex_shrink: 1, padding_tablet: box(8, 0, 0, 0) }, [
          section(E.bringTitle, 'what_to_bring', [body18('event_what_to_bring')]),
          section(E.hostedTitle, 'hosted_by', [body18('event_hosted_by'), body18('event_contact', { _css_classes: 'gtatx-if-contact' })]),
          section(E.accessibilityTitle, 'accessibility', [body18('event_accessibility')]),
          // Any number of ways (Bus, Scooter, Walk…): the plugin's tag prints the facts panel, blog.css styles it.
          section(E.gettingThereTitle, 'getting_there', [
            text('', c('color-ink'), type(22, 22, '700'), { __dynamic__: { editor: gtText('event_getting_there') } }),
          ]),
        ]),
        container(
          {
            width: px(384), width_tablet: { unit: '%', size: 100 }, flex_shrink: 0,
            flex_gap: gap(25), flex_gap_tablet: gap(16), padding: box(32), padding_tablet: box(24),
            background_background: 'classic', background_color: c('color-mist'),
          },
          [
            eventFact(E.labels.date, 'event_date'),
            eventFact(E.labels.time, 'event_time', 'time'),
            container({ flex_gap: gap(4) }, [
              caps(E.labels.location, 11),
              heading('', 'p', c('color-ink'), type(22, 22, '700', { ls: -0.44, lh: 'normal' }), { __dynamic__: { title: gtText('event_venue') } }),
              heading('', 'p', c('color-ink'), type(22, 22, '700', { ls: -0.44, lh: 'normal' }), { __dynamic__: { title: gtText('event_address') } }),
            ]),
            eventFact(E.labels.cost, 'event_cost', 'cost'),
            eventFact(E.labels.ages, 'event_ages', 'ages'),
            eventFact(E.labels.registration, 'event_registration', 'registration'),
            widget('divider', { color: c('color-sky'), weight: px(1), gap: px(0) }),
            container({ flex_gap: gap(12) }, [
              button(E.bookButton, '', 'green', { _css_classes: 'gtatx-arrow gtatx-arrow-spread gtatx-if-website', __dynamic__: { link: gtUrl('event_website') } }, true),
              button(E.calendarButton, '', 'outline', { _css_classes: 'gtatx-arrow gtatx-arrow-spread', __dynamic__: { link: gtUrl('event_ical') } }),
            ]),
          ],
        ),
      ],
    ),
    column(
      {
        _css_classes: 'gtatx-if-more_events', flex_gap: gap(40), flex_gap_mobile: gap(24),
        padding: box(80, 48), padding_mobile: box(40, 24),
        background_background: 'classic', background_color: c('color-leaf'),
        border_border: 'solid', border_width: box(1, 0, 0, 0), border_color: c('color-sky'),
        // The band runs full width; the column inside stays 1184px.
        content_width: 'boxed',
      },
      // Ink, not Figma's white: white on #74ab60 is 2.7:1 (fails WCAG).
      [sectionTitle(E.moreTitle, 48, '700'), loopGrid('__LOOP_EVENT__', 'gtatx_upcoming_events', 'tribe_events')],
    ),
  ],
  false,
);

// ---------- write ----------
const VERSION = '0.4';
function write(file: string, title: string, typeName: string, content: El[], extra: Record<string, unknown> = {}) {
  writeFileSync(join(OUT_DIR, file), JSON.stringify({ version: VERSION, title, type: typeName, ...extra, content }, null, 1) + '\n');
  console.log(`wordpress/elementor/${file}  ${title}`);
}

mkdirSync(OUT_DIR, { recursive: true });
write('blog-starter.json', '[WKRM] Blog post starter', 'section', [starter]);
for (const [name, make] of Object.entries({ ...blocks, image: figure, caption: undefined })) {
  if (!make) continue;
  write(`block-${name}.json`, `[WKRM] Block – ${name[0].toUpperCase()}${name.slice(1)}`, 'section', [bodyColumn([make()])]);
}
write('single-post.json', '[WKRM] Blog post', 'single-post', [singlePost], { page_settings: { preview_type: 'single/post' } });
write('single-event.json', '[WKRM] Community event', 'single-post', [singleEvent], { page_settings: { preview_type: 'single/tribe_events' } });
write('loop-item-related-card.json', '[WKRM] Related card', 'loop-item', [card(tag('post-terms', { taxonomy: 'category', separator: ', ' }), '', [160, 128])], {
  page_settings: { source: 'post' },
});
write('loop-item-event-card.json', '[WKRM] Event card', 'loop-item', [card(gtText('event_date_short'), E.viewEvent, [160, 160])], {
  page_settings: { source: 'tribe_events' },
});
console.log(`${copied.size} images in wordpress/elementor/images/ (served from ${IMAGES})`);
