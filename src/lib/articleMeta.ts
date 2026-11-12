import type { PageContent, Post } from '../content/schema';
import { text } from './i18n';
import { plainText } from './richText';

// The blog meta line under the description: "5 min read  ·  By Get There ATX".
// The client asked for no date by default; a post adds "Updated Oct 2026" only
// with `showDate` (in WordPress: the "Show date" box on the post).

const WORDS_PER_MINUTE = 200;
const monthYear = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Every word a reader sees in the body, for the read time. */
export function postWords(post: Post): string[] {
  const parts = [text(post.summary)];
  for (const b of post.body ?? []) {
    if (b.type === 'paragraph' || b.type === 'heading' || b.type === 'tip') parts.push(b.text);
    else if (b.type === 'list') parts.push(...b.items);
    else if (b.type === 'steps') b.items.forEach((s) => parts.push(s.title, ...s.text));
    else if (b.type === 'facts') b.items.forEach((f) => parts.push(f.label, f.value));
    else if (b.type === 'table') parts.push(...b.columns, ...b.rows.flat());
    else if (b.type === 'image' && b.caption) parts.push(b.caption);
  }
  return parts.map(plainText).join(' ').split(/\s+/).filter(Boolean);
}

export function readMinutes(post: Post): number {
  return Math.max(1, Math.round(postWords(post).length / WORDS_PER_MINUTE));
}

/** Figma separates the parts with two spaces either side of the dot. */
export const META_SEPARATOR = '  ·  ';

export function metaLine(post: Post, copy: PageContent['guide']): string {
  const parts = [copy.readTime.replace('{n}', String(readMinutes(post)))];
  if (post.showDate) parts.push(copy.updated.replace('{date}', monthYear.format(new Date(post.lastReviewed))));
  parts.push(copy.byline.replace('{author}', post.author ?? copy.defaultAuthor));
  return parts.join(META_SEPARATOR);
}
