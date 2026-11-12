// npm run seed:wp
// Writes wordpress/local-dev/seed-data.json (git-ignored) from the prototype's
// content, for wordpress/local-dev/seed.php to load into the LOCAL WordPress:
// the getthereatx.com blog posts (as regular-editor posts, i.e. Option B), the
// community events, and the external resources. Never used on the live site.

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Event } from '../src/content/schema';
import { expandEvent } from '../src/lib/recurrence';
import { load } from './content';

/** "2026-11-14 13:00:00" in Austin time, as The Events Calendar stores it. */
const austin = (d: Date) =>
  new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).format(d);

type L = { en: string };
type Block =
  | { type: 'paragraph' | 'heading'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'tip'; label?: string; text: string }
  | { type: 'steps'; items: { title: string; text: string[] }[] }
  | { type: 'facts'; items: { label: string; value: string }[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'button'; label: string; href: string };

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
/** [label](url) and **bold**, as HTML. */
const rich = (s: string) =>
  esc(s)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => `<a href="${href}">${label}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

/** One block as the regular editor would hold it (blog.css styles it). */
function html(b: Block): string {
  switch (b.type) {
    case 'paragraph':
      return `<p>${rich(b.text)}</p>`;
    case 'heading':
      return `<h2>${rich(b.text)}</h2>`;
    case 'list': {
      const tag = b.ordered ? 'ol' : 'ul';
      return `<${tag}>${b.items.map((i) => `<li>${rich(i)}</li>`).join('')}</${tag}>`;
    }
    case 'image':
      return `<figure><img src="{{img:${b.src}}}" alt="${esc(b.alt)}">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`;
    case 'tip':
      return `<blockquote><p>${rich(b.text)}</p></blockquote>`;
    case 'steps':
      return b.items.map((s, i) => `<h3>Step ${i + 1}: ${esc(s.title)}</h3>${s.text.map((t) => `<p>${rich(t)}</p>`).join('')}`).join('');
    case 'facts':
      return b.items.map((f) => `<p><strong>${esc(f.label)}:</strong> ${esc(f.value)}</p>`).join('');
    case 'table':
      return `<table><thead><tr>${b.columns.map((c) => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${b.rows
        .map((r) => `<tr>${r.map((c) => `<td>${rich(c)}</td>`).join('')}</tr>`)
        .join('')}</tbody></table>`;
    case 'button':
      return `<p><a class="button" href="${esc(b.href)}">${esc(b.label)}</a></p>`;
  }
}

const posts = load('posts') as {
  slug: string; title: L; summary: L; url: string; categories: string[]; published?: string; image?: { src: string; alt: string };
  video?: { youtubeId: string }; body?: Block[]; modes: string[]; needs: string[]; audiences: string[];
}[];
const categories = load('categories') as { slug: string; name: string }[];
const events = load('events') as Event[];
/** Free The Events Calendar has no repeating events, so each gets its next date (or its last, if it's over). */
const now = new Date();
const nextDate = (e: Event) => {
  const all = expandEvent(e);
  return all.find((o) => o.end > now) ?? all[all.length - 1];
};
const resources = load('resources') as { id: string; title: string; provider: string; action: string; oneLiner: string; url: string; lastChecked: string; modes: string[]; needs: string[]; audiences: string[]; internal?: boolean }[];

const data = {
  categories,
  posts: posts.map((p) => ({
    slug: p.slug,
    title: p.title.en,
    excerpt: p.summary.en,
    date: p.published,
    categories: p.categories,
    image: p.image,
    heroVideo: p.video ? `https://www.youtube.com/watch?v=${p.video.youtubeId}` : '',
    // Posts we haven't copied the text of yet link to the live post, as in the prototype.
    content: p.body ? p.body.map(html).join('\n') : `<p><a href="${p.url}">Read the full post on getthereatx.com</a></p>`,
    modes: p.modes,
    needs: p.needs,
    audiences: p.audiences,
  })),
  events: events.map((e) => ({
    slug: e.slug,
    title: e.title.en,
    description: e.blurb.en,
    start: austin(nextDate(e).start),
    end: austin(nextDate(e).end),
    venue: e.venue,
    image: e.image,
    url: e.url ?? '',
    cost: e.cost ?? '',
    organizer: e.organizer?.name ?? '',
    partners: e.organizer?.partners ?? '',
  })),
  resources: resources.filter((r) => !r.internal),
};

writeFileSync(join(import.meta.dirname, '..', 'wordpress', 'local-dev', 'seed-data.json'), JSON.stringify(data, null, 1) + '\n');
console.log(`wordpress/local-dev/seed-data.json: ${data.posts.length} posts, ${data.events.length} events, ${data.resources.length} external resources`);
