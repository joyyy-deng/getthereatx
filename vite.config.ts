import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Only this site, the Adobe font kit, the map tiles and the YouTube player may
// load. Added to the built page only: the dev server needs inline scripts.
// 'unsafe-inline' styles are for the theme variables and the map library.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://use.typekit.net https://p.typekit.net",
  "font-src 'self' data: https://use.typekit.net",
  "img-src 'self' data: blob: https://server.arcgisonline.com https://i.ytimg.com https://p.typekit.net",
  "connect-src 'self'",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const contentSecurityPolicy = (): Plugin => ({
  name: 'gtatx-csp',
  apply: 'build',
  transformIndexHtml: () => [
    { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' },
  ],
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  // GitHub Pages serves the site from /getthereatx/; the deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH ?? '/',
});
