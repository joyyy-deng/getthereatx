// npm run build:elementor [-- --images=https://…/images]
// Builds wordpress/elementor/home.json: the Home page as an Elementor page
// template (Templates → Saved Templates → Import Templates), made only of
// containers and native widgets (Heading, Text Editor, Image, Nested Accordion)
// so staff can edit every word and image in Elementor.
//
// Layout, sizes and wording follow src/pages/Home.tsx (Figma "home v1" desktop
// 775:3242, phone 865:5590): masthead + trip card, "New to this?" guides,
// "See what's going on", "Get there together". Wording, links and colors come
// from the same content files as the site (pages.json, theme.json,
// connect-cards.json, posts.json, resources.json); run this again after a
// design or copy change and re-import.
//
// Images: Elementor's importer downloads each image from its URL into the
// site's Media Library, so --images must be a web address the WordPress site
// can reach (default: this repo's raw GitHub folder, online after a push). The
// images used are copied to wordpress/elementor/images/.
//
// The phone layout is part of the file: every container has tablet and phone
// values (see elementor-kit.ts for the rules, scripts/check-elementor.ts checks them).

import { load } from './content';
import {
  FULL_WIDTH, IMAGES, PAGES, arrow, band, box, box_, c, dir, gap, heading, hide, href, image, justify, align, lines, minH, pad, pic, prefixed, px, rs, sectionTitle, selfW, ty, together, mascotCard, textEditor, usedImages, wd, writeTemplate, cta, id,
  type El, type Settings, type TogetherCopy,
} from './elementor-kit';

type L = { en: string };
interface GuideItemCopy { id: string; title: string; postSlug?: string; resourceId?: string; body?: string; image?: { src: string; alt: string }; linkLabel?: string }
interface HomeCopy {
  hero: { title: string[]; planTitle: string; button: string; illustrationAlt: string };
  guides: { title: string[]; seeAll: { title: string[]; to: string }; items: GuideItemCopy[] };
  discover: { title: string; cards: { title: string; image: { src: string; alt: string }; to: string }[]; explore: { title: string[]; to: string } };
  together: { title: string; button: { label: string; to: string } };
}
const pages = load('pages') as { home: HomeCopy; community: { together: { cardBodies: Record<string, string> } } };
const posts = load('posts') as { slug: string; url: string; summary: L; image?: { src: string; alt: string } }[];
const resources = load('resources') as { id: string; url: string; action: string; oneLiner: string }[];
const home = pages.home;

// ---------- 1. Masthead (Home.tsx: first <section>) ----------
// Desktop: headline + trip card on the left, the 451px picture on the right, bottoms
// aligned. Phones and tablets: headline beside a small picture, the trip card under them.
// The From / To form belongs to the trip planner tool (plugin), so the card is its
// heading plus a button to the Plan Your Trip page.
const illustration = (settings: Settings) =>
  box_(
    {
      background_background: 'classic',
      background_image: image('/images/home/hero-sky.webp', ''),
      background_size: 'cover',
      background_position: 'bottom center',
      ...settings,
    },
    [pic('art-hero-sloth-bus.png', home.hero.illustrationAlt, { w: '100%' })],
  );

// Shorter than Figma so "New to this?" shows on the first screen (Home.tsx, Joy 2026-11-17).
const masthead = band(
  {
    ...pad(box(40, 48), box(24, 48), box(24, 24)),
    border_border: 'solid',
    border_width: box(0, 0, 1, 0),
    border_color: c('color-ink'),
  },
  [
    box_({ ...dir('row', 'column', 'column'), ...gap(40, 24, 24), ...align('flex-end', 'stretch', 'stretch') }, [
      box_({ ...wd('60%', '100%', '100%'), ...gap(16, 20, 20) }, [
        box_({ ...dir('row'), ...gap(4), ...align('flex-start'), ...justify('space-between') }, [
          heading(home.hero.title.join(' '), 'h1', c('color-ink'), ty(80, 45, '600', { lh: 1.05, ls: -0.01 }), selfW('400px', '59%', '59%')),
          // Phones and tablets: 138px picture beside the headline.
          illustration({ ...wd('138px', '138px', '40%'), ...hide('desktop') }),
        ]),
        box_(
          {
            ...gap(20, 14, 14),
            ...pad(box(20, 20, 32, 20), box(16), box(16)),
            background_background: 'classic',
            background_color: c('color-sky'),
            ...rs('border_radius', { unit: 'px', top: '0', right: '37', bottom: '0', left: '0', isLinked: false }, { unit: 'px', top: '0', right: '30', bottom: '0', left: '0', isLinked: false }),
          },
          [
            heading(home.hero.planTitle, 'h2', c('color-ink'), ty(57, 32, '600', { lh: [1.05, 1.15], ls: -0.01 })),
            cta(home.hero.button, PAGES.plan, c('color-navy'), '#ffffff', 'white'),
          ],
        ),
      ]),
      // Desktop: the 451px picture (38% of the 1184 column) on the right.
      illustration({ ...wd('38%', '100%', '100%'), ...hide('tablet', 'mobile') }),
    ]),
  ],
);

// ---------- 2. New to this? (Home.tsx: second <section>) ----------
// Desktop: title + 400px card on the left, accordion on the right, 40 apart.
// Phones and tablets: title, accordion, then the card.
const guideItems = home.guides.items.map((item) => {
  const post = item.postSlug ? posts.find((p) => p.slug === item.postSlug) : undefined;
  const r = item.resourceId ? resources.find((x) => x.id === item.resourceId) : undefined;
  const body = item.body ?? post?.summary.en ?? r?.oneLiner ?? '';
  const pic_ = item.image ?? post?.image;
  const link = post ? { url: post.url, label: item.linkLabel ?? 'Read the guide' } : { url: r!.url, label: item.linkLabel ?? r!.action };
  return {
    title: item.title,
    content: box_(
      {
        ...gap(16),
        ...pad(box(24), box(16), box(16)),
        background_background: 'classic',
        background_color: c('color-sky'),
      },
      [
        ...(pic_ ? [pic(pic_.src, pic_.alt, { w: '100%', h: [180, 180, 150], cover: true })] : []),
        textEditor(`<p>${body}</p>`, c('color-navy'), ty(22, 16, '400', { lh: ['28px', '24px'] })),
        textEditor(`<p><a href="${link.url}" target="_blank" rel="noopener">${link.label} ↗</a></p>`, c('color-link'), ty(14, 12, '400', { lh: ['20px', '16px'], ls: 0.01 })),
      ],
    ),
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
    accordion_item_title_icon: { value: 'fas fa-plus', library: 'fa-solid' },
    accordion_item_title_icon_active: { value: 'fas fa-minus', library: 'fa-solid' },
    accordion_item_title_icon_position: 'end',
    accordion_item_title_position_horizontal: 'stretch',
    ...rs('icon_size', px(32), px(24), px(24)),
    normal_icon_color: c('color-ink'),
    hover_icon_color: c('color-ink'),
    active_icon_color: c('color-ink'),
    accordion_item_title_space_between: px(0),
    accordion_border_border: 'solid',
    accordion_border_width: box(1, 0, 0, 0),
    accordion_border_color: c('color-rule'),
    ...rs('accordion_padding', box(20, 0, 20, 16), box(16, 0), box(16, 0)),
    normal_title_color: c('color-ink'),
    hover_title_color: c('color-ink'),
    active_title_color: c('color-ink'),
    // The accordion's row titles: the same typography settings under the widget's own prefix.
    ...prefixed(ty(28, 22, '600', { ls: -0.01, lh: [1.15, '28px'] }), 'typography_', 'title_typography_'),
  },
  elements: guideItems.map((g) => g.content),
};

const seeAll = (extra: Settings) =>
  mascotCard({ title: home.guides.seeAll.title, to: home.guides.seeAll.to, tone: 'leaf', art: 'art-guides-kangaroo.png', layout: 'stacked', extra });

const guides = band({ ...pad(box(40, 48, 64, 48), box(32, 48, 40, 48), box(32, 24, 40, 24)), ...dir('row', 'column', 'column'), ...gap(40, 24, 24), ...align('flex-start', 'stretch', 'stretch') }, [
  box_({ ...wd('34%', '100%', '100%'), ...gap(24) }, [
    sectionTitle(lines(home.guides.title), c('color-ink')),
    seeAll(hide('tablet', 'mobile')),
  ]),
  box_({ ...wd('66%', '100%', '100%'), border_border: 'solid', border_width: box(0, 0, 1, 0), border_color: c('color-rule') }, [accordion]),
  seeAll(hide('desktop')),
]);

// ---------- 3. See what's going on (Home.tsx: third <section>) ----------
const photoCard = (card: HomeCopy['discover']['cards'][number]) =>
  box_(
    {
      ...dir('row'),
      ...align('flex-end'),
      ...justify('space-between'),
      ...gap(16),
      ...pad(box(16)),
      ...minH(218, 200, 200),
      overflow: 'hidden',
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
      link: { url: href(card.to), is_external: '', nofollow: '', custom_attributes: '' },
    },
    [heading(card.title, 'h3', '#ffffff', ty(28, 24, '600', { lh: 1.15, ls: -0.01 })), arrow('white', 16)],
  );

const discover = band(
  {
    ...gap(40, 24, 24),
    ...pad(box(64, 48), box(40, 48), box(40, 24)),
    border_border: 'solid',
    border_width: box(1, 0, 1, 0),
    border_color: c('color-ink'),
  },
  [
    sectionTitle(home.discover.title, c('color-ink')),
    box_({ ...dir('row', 'column', 'column'), ...gap(40, 24, 24), ...align('stretch') }, [
      box_({ ...wd('59%', '100%', '100%'), ...gap(32, 24, 24) }, home.discover.cards.map(photoCard)),
      mascotCard({ title: home.discover.explore.title, to: home.discover.explore.to, tone: 'sky', art: 'art-austin-dog.png', layout: 'side', extra: wd('41%', '100%', '100%') }),
    ]),
  ],
);

// ---------- 4. Get there together ----------
const togetherCopy: TogetherCopy = { ...home.together, cardBodies: pages.community.together.cardBodies };

// ---------- write ----------
const content = [masthead, guides, discover, together(togetherCopy, 'home')];
writeTemplate('home.json', '[WKRM] Sample Home', 'page', content, FULL_WIDTH);
console.log(`${usedImages().length} images in wordpress/elementor/images/ (served from ${IMAGES})`);
