// npm run import-resource-list -- "<folder>"
// Reads the owner's resource list (an Obsidian folder) and writes
// src/content/resource-list.json, so the site never depends on that folder.
//   <folder>/Resources/*.md   one note per resource: line 1 = #tags, then `link: <url>`
//   <folder>/blogs/*.md       one note per existing blog post: #tags, then `content: <post url>`
//   <folder>/Tag hierarchy.md the three filter groups and their parent tags
// Titles, links and tags are kept exactly as written (whitespace trimmed). Nothing is
// invented: a description is copied only from the old Trip Planning sheet row with the
// same link; otherwise it is left out.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { readTripPlanningSheet } from '../src/content/sheet';
import { CONTENT_DIR } from './content';

/** File names whose title differs from the file name (the underscore stands in for an apostrophe). */
const titleOverrides: Record<string, string> = {
  'UT Austin_s Orange Bike Project': "UT Austin's Orange Bike Project",
};

/** Display labels for run-together tags. Other tags show as written, first letter capitalized. */
const tagLabels: Record<string, string> = {
  Publictransit: 'Public transit',
  Parkandride: 'Park and ride',
  'Howtos/guides': 'How-tos / guides',
  HappeninginAustin: 'Happening in Austin',
  'Community/gettinginvolved': 'Community / getting involved',
  GreaterAustin: 'Greater Austin',
  'employers/organizations': 'Employers / organizations',
  'Families/youth': 'Families / youth',
  'Rideshare/ride-hailing/taxi': 'Rideshare / ride-hailing / taxi',
  'Maps/directions': 'Maps / directions',
};

/** A tag used on notes that should match another tag's filter. */
const tagAliases: Record<string, string> = {
  'Carpool/vanpool': 'Carpool',
};

const GROUP_IDS = ['mode', 'who', 'type'];

const folder = process.argv.slice(2).find((a) => !a.startsWith('-'));
if (!folder) {
  console.error('Usage: npm run import-resource-list -- "<folder>"');
  process.exit(1);
}

const label = (tag: string) => tagLabels[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1);
const warnings: string[] = [];

// --- Tag hierarchy ---------------------------------------------------------
interface TagNode {
  tag: string;
  label: string;
  children?: { tag: string; label: string }[];
}
const hashtags = (line: string) => [...line.matchAll(/(?:^|\s)#([^\s#]\S*)/g)].map((m) => m[1]);

const groups: { id: string; label: string; tags: TagNode[] }[] = [];
let parent: TagNode | undefined;
let awaitingChildren = false;
for (const raw of readFileSync(join(folder, 'Tag hierarchy.md'), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line) continue;
  if (line.startsWith('######')) {
    const [tag] = hashtags(line);
    if (!tag || !groups.length) continue;
    parent = { tag, label: label(tag), children: [] };
    groups[groups.length - 1].tags.push(parent);
    awaitingChildren = true;
  } else if (line.startsWith('###')) {
    groups.push({ id: GROUP_IDS[groups.length] ?? `group-${groups.length + 1}`, label: line.replace(/^#+\s*/, ''), tags: [] });
    parent = undefined;
    awaitingChildren = false;
  } else if (line.startsWith('#') && groups.length) {
    const tags = hashtags(line).map((tag) => ({ tag, label: label(tag) }));
    if (awaitingChildren && parent) {
      parent.children!.push(...tags);
      awaitingChildren = false;
    } else groups[groups.length - 1].tags.push(...tags);
  }
}
for (const g of groups) for (const t of g.tags) if (t.children && !t.children.length) delete t.children;

const known = new Set(groups.flatMap((g) => g.tags.flatMap((t) => [t.tag, ...(t.children ?? []).map((c) => c.tag)])));

// --- Notes -----------------------------------------------------------------
function readNotes(dir: string, key: 'link' | 'content') {
  return readdirSync(join(folder!, dir))
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const lines = readFileSync(join(folder!, dir, file), 'utf8').split(/\r?\n/);
      const tags = hashtags(lines[0] ?? '');
      const url = lines.map((l) => new RegExp(`^\\s*${key}:\\s*(\\S.*)$`).exec(l)?.[1].trim()).find(Boolean);
      const name = file.replace(/\.md$/, '');
      const title = titleOverrides[name] ?? name;
      if (!url) warnings.push(`${dir}/${file}: no "${key}:" line`);
      else if (!/^https?:\/\/\S+$/.test(url)) warnings.push(`${dir}/${file}: "${url}" is not a web address`);
      if (!tags.length) warnings.push(`${dir}/${file}: no tags on line 1`);
      for (const t of tags) if (!known.has(t) && !tagAliases[t]) warnings.push(`${dir}/${file}: tag #${t} is not in the tag hierarchy (kept on the record, left out of the filters)`);
      for (const t of tags) if (tagAliases[t]) warnings.push(`${dir}/${file}: tag #${t} is not in the tag hierarchy (counts as #${tagAliases[t]} in the filters)`);
      return { title, url: url ?? '', tags };
    });
}

// Descriptions only come from the old sheet, matched by link.
const normalize = (u: string) =>
  u
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(www\.)?/, '')
    .replace(/\/+$/, '');
const sheet = readTripPlanningSheet(readFileSync(join(CONTENT_DIR, 'sheets', 'trip-planning.csv'), 'utf8'));
const sheetByUrl = new Map(sheet.entries.filter((e) => e.url).map((e) => [normalize(e.url!), e]));

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const ids = new Set<string>();
const resources = readNotes('Resources', 'link').map((n) => {
  let id = slug(n.title);
  for (let i = 2; ids.has(id); i++) id = `${slug(n.title)}-${i}`;
  ids.add(id);
  const description = n.url ? sheetByUrl.get(normalize(n.url))?.description : undefined;
  return { id, title: n.title, url: n.url, tags: n.tags, ...(description ? { description } : {}) };
});
const guides = readNotes('blogs', 'content').map((n) => ({ title: n.title, url: n.url, tags: n.tags }));

// Two notes with the same link are worth knowing about.
const byUrl = new Map<string, string[]>();
for (const r of resources) byUrl.set(normalize(r.url), [...(byUrl.get(normalize(r.url)) ?? []), r.title]);
for (const [u, titles] of byUrl) if (titles.length > 1) warnings.push(`same link on several notes (${u}): ${titles.join(', ')}`);

const out = {
  imported: new Date().toISOString().slice(0, 10),
  groups,
  tagAliases,
  resources: resources.sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })),
  guides,
};
writeFileSync(join(CONTENT_DIR, 'resource-list.json'), JSON.stringify(out, null, 2) + '\n');

console.log(`${resources.length} resources (${resources.filter((r) => r.description).length} with a description copied from the sheet), ${guides.length} blog notes.`);
if (warnings.length) console.warn(`\n${warnings.length} things to check in the list:\n  ! ${warnings.join('\n  ! ')}`);
