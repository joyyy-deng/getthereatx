import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '../styles/index.css';
import './wp.css';
import { setAssetBase } from '../lib/asset';
import { setPageUrls, type PageUrls } from '../lib/pageLinks';
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

const TOOLS: Record<string, (el: HTMLElement) => ReactNode> = {
  plan: (el) => <PlanTrip height={el.dataset.gtatxHeight || undefined} />,
  resources: () => <Resources />,
};

document.querySelectorAll<HTMLElement>('[data-gtatx-mount]').forEach((el) => {
  const tool = TOOLS[el.dataset.gtatxMount ?? ''];
  if (!tool || el.dataset.gtatxMounted) return;
  el.dataset.gtatxMounted = '1';
  // A router with no routes: the tools only read and write the query string
  // (?from=…&to=…), so the WordPress page URL keeps its own path.
  createRoot(el).render(
    <StrictMode>
      <BrowserRouter>{tool(el)}</BrowserRouter>
    </StrictMode>,
  );
});
