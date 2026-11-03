import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import { defineConfig, type Plugin } from 'vite';
import type { AtRule, Node, Plugin as PostcssPlugin, Rule } from 'postcss';
import react from '@vitejs/plugin-react';

// Build for the WordPress plugin (wordpress/gtatx-tools/). `npm run build:wp`.
// The GitHub Pages build (vite.config.ts) is separate and unchanged.

const PLUGIN_DIR = resolve(__dirname, 'wordpress/gtatx-tools');
const SCOPE = '.gtatx-app';

/** The only /public files the two tools use (mode mascots). Everything else in public/ is ~22MB of page photos. */
const TOOL_IMAGES = ['images/modes/walk.png', 'images/modes/bike.png', 'images/modes/bus.png', 'images/modes/drive.png'];

/**
 * Puts every CSS rule under .gtatx-app so nothing leaks onto the theme:
 * Tailwind's preflight, the base rules in index.css, tokens.css's :root
 * variables and Leaflet's styles. html / body / :root become the wrapper itself.
 */
function scopeCss(scope: string): PostcssPlugin {
  const root = /^(:root|html|body|:host)$/;
  const scopeSelector = (sel: string) => {
    const s = sel.trim();
    if (root.test(s)) return scope;
    const lead = /^(html|body|:root)\s+/.exec(s);
    if (lead) return `${scope} ${s.slice(lead[0].length)}`;
    if (s === '*') return `${scope}, ${scope} *`;
    return `${scope} ${s}`;
  };
  return {
    postcssPlugin: 'gtatx-scope',
    Rule(rule: Rule) {
      if ((rule as Rule & { scoped?: boolean }).scoped) return;
      for (let p: Node | undefined = rule.parent; p; p = p.parent) {
        if (p.type === 'atrule' && /keyframes$/.test((p as AtRule).name)) return;
      }
      rule.selectors = [...new Set(rule.selectors.map(scopeSelector).flatMap((s) => s.split(', ')))];
      (rule as Rule & { scoped?: boolean }).scoped = true;
    },
  };
}

/** Copies TOOL_IMAGES into the plugin's assets/ after the build. */
function copyToolImages(): Plugin {
  return {
    name: 'gtatx-copy-tool-images',
    closeBundle() {
      const out = resolve(PLUGIN_DIR, 'assets');
      rmSync(out, { recursive: true, force: true });
      for (const file of TOOL_IMAGES) {
        const to = resolve(out, file);
        mkdirSync(dirname(to), { recursive: true });
        cpSync(resolve(__dirname, 'public', file), to);
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyToolImages()],
  // Fonts and Leaflet images are found relative to the CSS file, wherever WordPress serves the plugin from.
  base: './',
  publicDir: false,
  css: {
    postcss: { plugins: [tailwindcss(), autoprefixer(), scopeCss(SCOPE)] },
  },
  build: {
    outDir: resolve(PLUGIN_DIR, 'build'),
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/wp/main.tsx'),
      output: {
        // One classic script, so WordPress can enqueue it like any other.
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'gtatx-tools.js',
        assetFileNames: (info) =>
          info.names?.some((n) => n.endsWith('.css')) ? 'gtatx-tools.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
