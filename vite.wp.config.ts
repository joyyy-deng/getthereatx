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

/** The only /public files the two tools use. Everything else in public/ is page photos the tools don't need. */
const TOOL_IMAGES = [
  // Mode cards (plan-modes.json) and directory image slots.
  'images/mascots/mode-walk.svg',
  'images/mascots/mode-bike.svg',
  'images/mascots/mode-bus.svg',
  'images/mascots/mode-bus-walk.svg',
  'images/mascots/mode-drive.svg',
  // From / To fields and the swap button.
  'icons/circle-dot.svg',
  'icons/map-pin.svg',
  'icons/arrow-left-right.svg',
  // Resources hero.
  'images/resources/commuter.jpg',
];

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

/**
 * Turns screen-width media queries (Tailwind's sm/md/lg/xl, tokens.css's phone
 * type scale) into container queries on the .gtatx-app wrapper. A WordPress
 * theme may put the tool in a narrow content column on a wide screen; this
 * makes the layout follow the space the tool actually has. Runs after
 * scopeCss. A container query can't style the container itself, so rules on
 * the bare wrapper move to its children (the CSS variables still inherit).
 */
function widthQueriesToContainer(scope: string, name: string): PostcssPlugin {
  const widthOnly = /^\(\s*(min|max)-width:\s*[\d.]+px\s*\)$/;
  return {
    postcssPlugin: 'gtatx-container-queries',
    AtRule: {
      media(at: AtRule) {
        const params = at.params.trim();
        // Tailwind's max-* variants print as "not all and (min-width: …)".
        const negated = /^not all and (\(.*\))$/.exec(params);
        if (!widthOnly.test(negated?.[1] ?? params)) return;
        at.name = 'container';
        at.params = negated ? `${name} not ${negated[1]}` : `${name} ${params}`;
        at.walkRules((rule) => {
          rule.selectors = rule.selectors.map((s) => (s === scope ? `${scope} > *` : s));
        });
      },
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
    postcss: { plugins: [tailwindcss(), autoprefixer(), scopeCss(SCOPE), widthQueriesToContainer(SCOPE, 'gtatx')] },
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
