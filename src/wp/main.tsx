import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../styles/index.css';
import './wp.css';
import { getThemeNow } from '../data';
import { setAssetBase } from '../lib/asset';
import { setPageUrls, type PageUrls } from '../lib/pageLinks';
import { applyTheme } from '../lib/theme';
import { PlanTrip } from '../pages/PlanTrip';
import { Resources } from '../pages/Resources';

// WordPress entry (gtatx-tools plugin). Each shortcode prints
// <div class="gtatx-app" data-gtatx-mount="plan|resources">; this mounts the
// matching tool there. No Nav or Footer: the WordPress theme provides them.
// All CSS is scoped under .gtatx-app by vite.wp.config.ts.

interface WpConfig {
  /** The plugin's assets/ URL, for images written as "/images/…" in content. */
  assetBase: string;
  /** WordPress URL for each prototype page, for links between pages. */
  pages: PageUrls;
}

declare global {
  interface Window {
    gtatxTools?: Partial<WpConfig>;
  }
}

const DEFAULT_PAGES: PageUrls = {
  home: '/',
  plan: '/plan-your-trip/',
  community: '/community/',
  resources: '/resources/',
  students: '/resources/students/',
};

const config = window.gtatxTools ?? {};
if (config.assetBase) setAssetBase(config.assetBase);
setPageUrls({ ...DEFAULT_PAGES, ...config.pages });

const TOOLS: Record<string, () => ReactNode> = {
  plan: () => <PlanTrip />,
  resources: () => <Resources />,
};

/**
 * `width="full"` (the default): stretch the tool from the content column to
 * the full page width, like the Figma pages, however narrow the theme's column
 * is. Measured in pixels (not 100vw) so a scrollbar never adds sideways scroll.
 */
const fullWidth: HTMLElement[] = [];
function fitFullWidth() {
  const page = document.documentElement.clientWidth;
  // `important` because block themes set max-width and margin: auto !important on content.
  const set = (el: HTMLElement, prop: string, value: string) => el.style.setProperty(prop, value, 'important');
  for (const el of fullWidth) {
    set(el, 'max-width', 'none');
    set(el, 'margin-right', '0px');
    set(el, 'margin-left', '0px');
    set(el, 'margin-left', `${-el.getBoundingClientRect().left}px`);
    set(el, 'width', `${page}px`);
  }
}
window.addEventListener('resize', fitFullWidth);

document.querySelectorAll<HTMLElement>('[data-gtatx-mount]').forEach((el) => {
  const tool = TOOLS[el.dataset.gtatxMount ?? ''];
  if (!tool || el.dataset.gtatxMounted) return;
  el.dataset.gtatxMounted = '1';
  // Colors and fonts (theme.json) go on the wrapper, so they never touch the theme's own styles.
  applyTheme(getThemeNow(), el);
  if (el.dataset.gtatxWidth !== 'content') fullWidth.push(el);
  // A router with no routes: the tools only read and write the query string
  // (?from=…&to=…), so the WordPress page URL keeps its own path.
  createRoot(el).render(
    <StrictMode>
      <BrowserRouter>{tool()}</BrowserRouter>
    </StrictMode>,
  );
});
fitFullWidth();
