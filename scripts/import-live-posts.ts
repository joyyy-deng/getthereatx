/// <reference lib="dom" />
// npm run import-live-posts [-- --all]
// Copies blog posts from getthereatx.com (WordPress REST API) into the
// prototype's format (posts.json `body` blocks), word for word:
//   headings → heading, paragraphs → paragraph ([links](…) and **bold** kept),
//   lists → list, images → image (downloaded to public/images/uploads/, never
//   hotlinked, with the post's own alt text and caption), "details" sections
//   → their summary as a heading, then their content.
// No wording changes. Italic and color styling is dropped (the words stay).
// Only posts without a body are filled unless --all is given. Each post is
// checked: every word of the live text must appear, in order, in the result.
// Writes blocks to stdout-friendly JSON in --out (default: scratch file) for
// scripts/content-insert to merge, or straight into posts.json with --write.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { CONTENT_DIR } from './content';

// jsdom ships no types; this is the one piece of it we use.
const { JSDOM } = (await import('jsdom' as string)) as { JSDOM: new (html: string) => { window: { document: Document } } };

const ROOT = join(import.meta.dirname, '..');
const ALL = process.argv.includes('--all');
const API = 'https://getthereatx.com/wp-json/wp/v2/posts?per_page=100&_fields=id,slug,link,content';

type Block =
  | { type: 'paragraph' | 'heading'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string };

const clean = (s: string) => s.replace(/\u00a0/g, ' ').replace(/[ \t\r\n]+/g, ' ');

/** Inline content as our rich text: [label](url) links, **bold**, plain words. */
function rich(node: Node): string {
  let out = '';
  node.childNodes.forEach((c) => {
    if (c.nodeType === 3) out += c.textContent ?? '';
    else if (c.nodeType === 1) {
      const el = c as Element;
      const tag = el.tagName.toLowerCase();
      const inner = rich(el);
      if (tag === 'br') out += ' ';
      else if (tag === 'a' && el.getAttribute('href') && inner.trim()) {
        // Spaces at the link's edges stay outside it, so no words run together.
        const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(clean(inner))!;
        out += `${m[1]}[${m[2]}](${el.getAttribute('href')!.trim()})${m[3]}`;
      }
      else if ((tag === 'b' || tag === 'strong') && inner.trim() && !/\*\*/.test(inner)) {
        const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(inner)!;
        out += `${m[1]}**${m[2]}**${m[3]}`;
      } else if (tag === 'img' || tag === 'figure' || tag === 'figcaption') {
        /* handled as blocks */
      } else out += inner;
    }
  });
  return out;
}
const tidy = (s: string) => clean(s).trim().replace(/\*\*\s*\*\*/g, '').replace(/\*\*(\s+)\*\*/g, '$1');

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'figure', 'img', 'details', 'summary', 'div', 'section', 'blockquote', 'table', 'hr']);

async function saveImage(src: string): Promise<string> {
  const url = new URL(src, 'https://getthereatx.com/');
  const m = /\/wp-content\/uploads\/(.+)$/.exec(url.pathname);
  const rel = `/images/uploads/${m ? m[1] : url.pathname.split('/').pop()}`;
  const file = join(ROOT, 'public', rel);
  if (!existsSync(file)) {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok || !(res.headers.get('content-type') ?? '').startsWith('image/')) throw new Error(`image ${url}: ${res.status}`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  return rel;
}

/** The largest version WordPress offers for an <img> (srcset), else its src. */
function bestSrc(img: Element): string {
  const set = img.getAttribute('srcset');
  if (set) {
    const best = set
      .split(',')
      .map((s) => s.trim().split(/\s+/))
      .map(([u, w]) => ({ u, w: parseInt(w) || 0 }))
      .sort((a, b) => b.w - a.w)[0];
    if (best?.u) return best.u;
  }
  return img.getAttribute('data-src') || img.getAttribute('src') || '';
}

const missingAlt: string[] = [];

async function walk(el: Element, blocks: Block[], slug: string): Promise<void> {
  for (const c of Array.from(el.childNodes)) {
    if (c.nodeType === 3) {
      const t = tidy(c.textContent ?? '');
      if (t) blocks.push({ type: 'paragraph', text: t });
      continue;
    }
    if (c.nodeType !== 1) continue;
    const e = c as Element;
    const tag = e.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag) || tag === 'summary') {
      // Headings are bold already: no ** inside them.
      const t = tidy(rich(e)).replace(/\*\*/g, '');
      if (t) blocks.push({ type: 'heading', text: t });
    } else if (tag === 'p') {
      // Images inside a paragraph become their own blocks, in order.
      for (const img of Array.from(e.querySelectorAll('img'))) await image(img, undefined, blocks, slug);
      const t = tidy(rich(e));
      if (t) blocks.push({ type: 'paragraph', text: t });
    } else if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(e.querySelectorAll('li'))
        .map((li) => {
          const copy = li.cloneNode(true) as Element;
          copy.querySelectorAll('ul,ol').forEach((n) => n.remove()); // nested lists come as their own items
          return tidy(rich(copy));
        })
        .filter(Boolean);
      if (items.length) blocks.push({ type: 'list', ordered: tag === 'ol', items });
    } else if (tag === 'figure') {
      const img = e.querySelector('img');
      const cap = e.querySelector('figcaption');
      if (img) await image(img, cap ? tidy(cap.textContent ?? '') : undefined, blocks, slug);
      else await walk(e, blocks, slug);
    } else if (tag === 'img') {
      await image(e, undefined, blocks, slug);
    } else if (tag === 'hr' || tag === 'script' || tag === 'style' || tag === 'noscript') {
      /* nothing */
    } else if (Array.from(e.children).some((k) => BLOCK_TAGS.has(k.tagName.toLowerCase()))) {
      await walk(e, blocks, slug);
    } else {
      // A div or span holding only inline content: one paragraph.
      const t = tidy(rich(e));
      if (t) blocks.push({ type: 'paragraph', text: t });
      for (const img of Array.from(e.querySelectorAll('img'))) await image(img, undefined, blocks, slug);
    }
  }
}

async function image(img: Element, caption: string | undefined, blocks: Block[], slug: string) {
  const src = bestSrc(img);
  if (!src) return;
  const alt = clean(img.getAttribute('alt') ?? '').trim();
  if (!alt) missingAlt.push(`${slug}: ${src}`);
  blocks.push({ type: 'image', src: await saveImage(src), alt, ...(caption ? { caption } : {}) });
}

/** Every word of the live text must be in the blocks, as many times as it appears there. */
function check(html: string, blocks: Block[]): string[] {
  const words = (s: string) => clean(s).replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\*\*/g, '').match(/[\p{L}\p{N}'’$%&@#+-]+/gu) ?? [];
  const live = words(new JSDOM(html).window.document.body.textContent ?? '');
  const ours = words(blocks.map((b) => (b.type === 'list' ? b.items.join(' ') : b.type === 'image' ? b.caption ?? '' : b.text)).join(' '));
  const have = new Map<string, number>();
  for (const w of ours) have.set(w, (have.get(w) ?? 0) + 1);
  const missing: string[] = [];
  for (const w of live) {
    const n = have.get(w) ?? 0;
    if (n > 0) have.set(w, n - 1);
    else missing.push(w);
  }
  return missing;
}

const live = (await (await fetch(API)).json()) as { slug: string; link: string; content: { rendered: string } }[];
const postsFile = join(CONTENT_DIR, 'posts.json');
const posts = JSON.parse(readFileSync(postsFile, 'utf8')) as { slug: string; url: string; body?: unknown }[];
const norm = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
const result: Record<string, Block[]> = {};

for (const p of posts) {
  if (p.body && !ALL) continue;
  const src = live.find((l) => norm(l.link) === norm(p.url));
  if (!src) {
    console.log(`✗ ${p.slug}: not found on getthereatx.com`);
    continue;
  }
  const doc = new JSDOM(`<body>${src.content.rendered}</body>`).window.document;
  const blocks: Block[] = [];
  await walk(doc.body, blocks, p.slug);
  // Drop exact repeats next to each other (theme markup sometimes doubles a line),
  // and a first heading that only repeats the post's title (the page shows the title already).
  const deduped = blocks.filter((b, i) => i === 0 || JSON.stringify(b) !== JSON.stringify(blocks[i - 1]));
  const title = (p as { title?: { en: string } }).title?.en ?? '';
  const first = deduped.find((b) => b.type !== 'image');
  if (first?.type === 'heading' && first.text.toLowerCase().replace(/\W+/g, '') === title.toLowerCase().replace(/\W+/g, '')) deduped.splice(deduped.indexOf(first), 1);
  const missing = check(src.content.rendered, deduped);
  result[p.slug] = deduped;
  console.log(`${missing.length ? '!' : '✓'} ${p.slug}: ${deduped.length} blocks${missing.length ? `, ${missing.length} words not found: ${missing.slice(0, 12).join(' ')}` : ''}`);
}

const out = process.argv.find((a) => a.startsWith('--out='))?.slice(6) ?? join(ROOT, 'node_modules', '.tmp', 'live-post-bodies.json');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, JSON.stringify(result, null, 2));
console.log(`\nBodies written to ${out}`);
if (missingAlt.length) console.log(`Images with no alt text on the live site (flag for the client):\n  ${missingAlt.join('\n  ')}`);
