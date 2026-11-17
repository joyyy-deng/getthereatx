// npm run build:elementor:site [-- --images=https://…/images]
// Builds the rest of the site's Elementor templates into wordpress/elementor/:
//
//   header.json          [WKRM] Header      Theme Builder Header (Elementor Pro: Nav Menu widget)
//   footer.json          [WKRM] Footer      Theme Builder Footer (Elementor Pro)
//   community.json       [WKRM] Community   page template; the events are a Loop Grid (Elementor Pro)
//   plan.json            [WKRM] Plan your trip   page template: one [gtatx_trip_planner] shortcode
//   resources-page.json  [WKRM] Resources   page template: one [gtatx_resources] shortcode
//
// Layout and sizes follow the React site (src/components/layout/Nav.tsx, MobileMenu.tsx,
// Footer.tsx, src/pages/Community.tsx, src/components/TogetherBand.tsx and
// src/components/ui/MascotCard.tsx), built from the Figma frames (Nav 860:1645, Footer
// 1117:4256 / 1117:4216, Community 787:5332 / 865:6182). Wording comes from pages.json and
// src/components/layout/siteLinks.ts. Plan and Resources are interactive screens drawn by
// the gtatx-tools plugin (the same React code), so those two are just a shortcode.
// Every size has tablet and phone values; see elementor-kit.ts and scripts/check-elementor.ts.

import { load } from './content';
import { DIRECTORY, LEGAL, SOCIAL } from '../src/components/layout/siteLinks';
import {
  FULL_WIDTH, IMAGES, PAGES, align, band, box, box_, c, dir, gap, heading, hide, href, justify, mascotCard, minH, pad, pic, prefixed, px, rs, together, ty, usedImages, wd, widget, writeTemplate,
  type El, type Settings, type TogetherCopy,
} from './elementor-kit';

interface CommunityCopy {
  together: { title: string; button: { label: string; to: string }; cardBodies: Record<string, string> };
  events: { title: string };
  explore: { title: string[]; to: string };
}
const community = (load('pages') as { community: CommunityCopy }).community;

// ---------- Header (Nav.tsx, MobileMenu.tsx) ----------
// 72px bar on desktop with the logo (188 wide) and three 16px Demibold tabs, the current page
// tinted sky. Tablets and phones: 80px bar with a rule under it, the larger logo and a menu
// button (44px) that opens the menu as a list of big rows. Staff manage the links in
// Appearance → Menus (the widget shows the menu named below).
export const MENU_NAME = 'gtatx-main';
const navMenu = widget('nav-menu', {
  menu: MENU_NAME,
  layout: 'horizontal',
  align_items: 'flex-end',
  // Collapses into the menu button on tablets and phones (React shows the tabs from 1024px up).
  dropdown: 'tablet',
  toggle: 'burger',
  full_width: 'stretch',
  submenu_icon: '',
  ...prefixed(ty(16, 16, '600', { lh: '24px' }), 'typography_', 'menu_typography_'),
  color_menu_item: c('color-ink'),
  color_menu_item_hover: c('color-ink'),
  color_menu_item_active: c('color-ink'),
  pointer: 'background',
  // Hover: leaf green sweeps up from the bottom (React Nav does the same).
  animation_background: 'sweep-up',
  pointer_color_menu_item_hover: c('color-leaf'),
  pointer_color_menu_item_active: c('color-sky'),
  padding_horizontal_menu_item: px(24),
  padding_vertical_menu_item: px(24),
  menu_space_between: px(4),
  // The phone menu: big rows (React MobileMenu: 32px Demibold, 72px tall, a rule between, the current page tinted).
  ...prefixed(ty(32, 32, '600', { lh: 1.15, ls: -0.01 }), 'typography_', 'dropdown_typography_'),
  color_dropdown_item: c('color-ink'),
  background_color_dropdown_item: '#ffffff',
  color_dropdown_item_hover: c('color-ink'),
  background_color_dropdown_item_hover: c('color-mist'),
  color_dropdown_item_active: c('color-ink'),
  background_color_dropdown_item_active: c('color-sky-nav'),
  padding_horizontal_dropdown_item: px(24),
  padding_vertical_dropdown_item: px(18),
  dropdown_divider_border: 'solid',
  dropdown_divider_width: px(1),
  dropdown_divider_color: c('color-rule'),
  toggle_color: c('color-ink'),
  toggle_background_color: 'transparent',
  toggle_size: px(44),
  toggle_icon_size: px(24),
  toggle_align: 'right',
});

const header = box_(
  {
    ...minH(72, 80, 80),
    ...justify('center'),
    background_background: 'classic',
    background_color: '#ffffff',
    ...rs('border_width', box(0), box(0, 0, 1, 0), box(0, 0, 1, 0)),
    border_border: 'solid',
    border_color: c('color-rule'),
    z_index: 1100,
    sticky: 'top',
    sticky_on: ['desktop', 'tablet', 'mobile'],
    sticky_offset: 0,
  },
  [
    box_({ ...dir('row'), ...align('center'), ...justify('space-between'), ...gap(16), ...pad(box(0, 0, 0, 16), box(8, 24), box(8, 24)), ...minH(72, 80, 80) }, [
      pic('art-logo-nav.png', 'Get There ATX', { w: 188, link: PAGES.home, ...hide('tablet', 'mobile') }),
      pic('art-logo-footer.png', 'Get There ATX', { w: [210, 210, 210], link: PAGES.home, ...hide('desktop') }),
      navMenu,
    ]),
  ],
  false,
);

// ---------- Footer (Footer.tsx) ----------
// Desktop: 1px rule on top. Left 38.9%: logo 330 wide, then "Keep Austin Moving." 32px Demibold.
// Right: a sky panel with two link columns, the social links, a navy rule and the legal line.
// Phones: the same stacked, logo 248 wide, invitation 22px, links 16px, small print 12px.
const navy = c('color-navy');
type SiteLink = { label: string } & ({ to: string } | { href: string });
const linkUrl = (l: SiteLink) => ('to' in l ? href(l.to) : l.href);
const isExternal = (l: SiteLink) => 'href' in l && l.href.startsWith('http');
/** A text link that is 44px tall (tap target) whatever the screen. */
const textLink = (l: SiteLink, color: string, t: Settings, padY: [number, number]) =>
  heading(l.label, 'p', color, t, {
    link: { url: linkUrl(l), is_external: isExternal(l) ? 'on' : '', nofollow: '', custom_attributes: '' },
    ...rs('_padding', box(padY[0], 0), box(padY[0], 0), box(padY[1], 0)),
  });

const directoryColumn = (links: readonly SiteLink[]) =>
  box_(
    { ...wd('50%') },
    links.map((l) => textLink(l, navy, ty(22, 16, '600', { lh: ['28px', '24px'], ls: 0.01 }), [8, 10])),
  );

const socialLink = (s: (typeof SOCIAL)[number]) => {
  const icon = s.label === 'Facebook' ? { value: 'fab fa-facebook', library: 'fa-brands' } : s.label === 'Instagram' ? { value: 'fab fa-instagram', library: 'fa-brands' } : { value: 'fas fa-envelope', library: 'fa-solid' };
  return box_(
    {
      ...dir('row'),
      ...align('center'),
      ...gap(8, 8, 5),
      ...wd('fit-content'),
      ...minH(44),
      html_tag: 'a',
      link: { url: s.href, is_external: s.href.startsWith('http') ? 'on' : '', nofollow: '', custom_attributes: '' },
    },
    [
      widget('icon', { selected_icon: icon, view: 'default', primary_color: navy, ...rs('size', px(24)), align: 'left' }),
      heading(s.label, 'span', navy, ty(14, 12, '600', { lh: ['20px', '16px'], ls: 0.01 })),
    ],
  );
};

const footer = box_(
  {
    ...dir('row', 'column', 'column'),
    border_border: 'solid',
    border_width: box(1, 0, 0, 0),
    border_color: c('color-rule'),
    background_background: 'classic',
    background_color: '#ffffff',
  },
  [
    box_({ ...wd('38.9%', '100%', '100%'), ...gap(12, 24, 24), ...pad(box(40, 64), box(24), box(24)) }, [
      pic('art-logo-footer.png', 'Get There ATX', { w: [330, 248, 248], link: PAGES.home }),
      heading('Keep Austin<br>Moving.', 'p', c('color-ink'), ty(32, 22, '600', { lh: [1.15, '28px'], ls: -0.01 })),
    ]),
    box_(
      {
        ...wd('61.1%', '100%', '100%'),
        ...gap(24, 20, 20),
        ...pad(box(40, 64, 16, 48), box(24), box(24)),
        background_background: 'classic',
        background_color: c('color-sky'),
      },
      [
        box_({ ...dir('row'), ...gap(48, 20, 20) }, DIRECTORY.map((g) => directoryColumn(g as readonly SiteLink[]))),
        box_({ ...dir('row'), ...gap(16), flex_wrap: 'wrap' }, SOCIAL.map(socialLink)),
        widget('divider', { style: 'solid', weight: px(1), color: navy, ...rs('gap', px(0)), ...rs('width', { unit: '%', size: 100 }) }),
        box_({ ...dir('row', 'column', 'column'), ...align('center', 'flex-start', 'flex-start'), ...justify('space-between', 'flex-start', 'flex-start'), ...gap(20) }, [
          heading('© 2026 Get There ATX. All rights reserved.', 'p', c('color-ink-muted'), ty(14, 12, '600', { lh: ['20px', '16px'], ls: 0.01 })),
          box_({ ...dir('row'), ...gap(24), ...wd('fit-content') }, LEGAL.map((l) => textLink(l, c('color-ink-muted'), ty(14, 12, '600', { lh: ['20px', '16px'], ls: 0.01 }), [12, 14]))),
        ]),
      ],
    ),
  ],
  false,
);

// ---------- Community (Community.tsx) ----------
// "Get there together" band, then "Trade a little screen time for outside time." with the
// upcoming events (a Loop Grid using [WKRM] Event card, Query ID gtatx_upcoming_events), then
// the green "Explore Austin" card.
const togetherCopy: TogetherCopy = community.together;
const eventsGrid = widget('loop-grid', {
  template_id: '__LOOP_EVENT__',
  ...rs('columns', '3', '2', '1'),
  posts_per_page: 6,
  column_gap: px(24),
  row_gap: px(24),
  row_gap_mobile: px(16),
  post_query_post_type: 'tribe_events',
  post_query_posts_per_page: 6,
  post_query_query_id: 'gtatx_upcoming_events',
  pagination_type: '',
});
const eventsSection = band(
  {
    _element_id: 'events',
    ...gap(40, 28, 28),
    ...pad(box(56, 48), box(40, 48), box(40, 24)),
  },
  [
    heading(community.events.title, 'h2', c('color-ink'), ty(36, 28, '600', { lh: [1.05, 1.15], ls: -0.01 })),
    eventsGrid,
    mascotCard({ title: community.explore.title, to: community.explore.to, tone: 'leaf', art: 'art-austin-dog.png', layout: 'side', titleSize: [36, 45] }),
  ],
);

// ---------- Plan your trip / Resources: one shortcode each ----------
const shortcodePage = (code: string): El[] => [box_({ content_width: 'full' }, [widget('shortcode', { shortcode: code })], false)];

// ---------- write ----------
writeTemplate('header.json', '[WKRM] Header', 'header', [header]);
writeTemplate('footer.json', '[WKRM] Footer', 'footer', [footer]);
writeTemplate('community.json', '[WKRM] Community', 'page', [together(togetherCopy, 'community'), eventsSection], FULL_WIDTH);
writeTemplate('plan.json', '[WKRM] Plan your trip', 'page', shortcodePage('[gtatx_trip_planner]'), FULL_WIDTH);
writeTemplate('resources-page.json', '[WKRM] Resources', 'page', shortcodePage('[gtatx_resources]'), FULL_WIDTH);
console.log(`${usedImages().length} images in wordpress/elementor/images/ (served from ${IMAGES})`);
