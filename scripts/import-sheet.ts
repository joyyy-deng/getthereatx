// npm run import-sheet -- "path/to/Website Content.xlsx"
//
// Copies the "Trip Planning" tab of the client's spreadsheet into
// src/content/sheets/trip-planning.csv. Use the .xlsx download (Google Sheets:
// File → Download → Microsoft Excel), not .csv: a CSV download keeps only each
// link's title, while the .xlsx keeps the web address behind it. Every cell is
// copied as written, except that Link cells become their web address.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { CONTENT_DIR } from './content';

const TAB = 'Trip Planning';
const OUT = join(CONTENT_DIR, 'sheets', 'trip-planning.csv');

/** Read every file in a .xlsx (it's a zip) into memory. */
function unzip(buf: Buffer): Map<string, Buffer> {
  // The central directory lists every file; its location is in the last 22+ bytes.
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('not a .xlsx file');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = new Map<string, Buffer>();
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const size = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nameLen);
    const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const data = buf.subarray(start, start + size);
    files.set(name, method === 8 ? inflateRawSync(data) : data);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const decode = (s: string) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

/** All the text in an XML fragment's <t> elements (rich text has several). */
const textOf = (xml: string) => [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => decode(m[1])).join('');

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

function readTab(files: Map<string, Buffer>, tab: string): string[][] {
  const xml = (path: string) => files.get(path)?.toString('utf8') ?? '';
  const strings = [...xml('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) => textOf(m[1]));

  // Tab name → its worksheet file.
  const sheets = [...xml('xl/workbook.xml').matchAll(/<sheet\s[^>]*\/>/g)].map((m) => m[0]);
  const sheet = sheets.find((s) => decode(attr(s, 'name') ?? '').trim() === tab);
  if (!sheet) throw new Error(`no tab named "${tab}"`);
  const rels = xml('xl/_rels/workbook.xml.rels');
  const target = [...rels.matchAll(/<Relationship\s[^>]*\/>/g)]
    .map((m) => m[0])
    .find((r) => attr(r, 'Id') === attr(sheet, 'r:id'));
  const path = `xl/${attr(target ?? '', 'Target')!.replace(/^\/?xl\//, '')}`;
  const sheetXml = xml(path);

  // Hyperlinks: cell ref → web address.
  const sheetRels = xml(path.replace(/worksheets\/(.*)$/, 'worksheets/_rels/$1.rels'));
  const relTarget = new Map(
    [...sheetRels.matchAll(/<Relationship\s[^>]*\/>/g)].map((m) => [attr(m[0], 'Id'), decode(attr(m[0], 'Target') ?? '')]),
  );
  const links = new Map(
    [...sheetXml.matchAll(/<hyperlink\s[^>]*\/>/g)].map((m) => [attr(m[0], 'ref'), relTarget.get(attr(m[0], 'r:id'))]),
  );

  const colIndex = (ref: string) => [...ref.replace(/\d+/g, '')].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1;
  const rows: string[][] = [];
  for (const row of sheetXml.matchAll(/<row\s[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const c of row[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const ref = attr(` ${c[1]}`, 'r')!;
      const type = attr(` ${c[1]}`, 't');
      const inner = c[2] ?? '';
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value = type === 's' && v ? strings[Number(v)] : type === 'inlineStr' ? textOf(inner) : decode(v ?? '');
      if (links.get(ref)) value = links.get(ref)!;
      cells[colIndex(ref)] = value;
    }
    rows.push(Array.from(cells, (x) => x ?? ''));
  }
  // Drop empty rows and the empty columns to the right.
  const filled = rows.filter((r) => r.some((x) => x.trim()));
  const width = Math.max(...filled.map((r) => r.reduce((w, x, i) => (x.trim() ? i + 1 : w), 0)));
  return filled.map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''));
}

const csvCell = (s: string) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run import-sheet -- "path/to/Website Content.xlsx"');
  process.exit(1);
}
const rows = readTab(unzip(readFileSync(file)), TAB);
writeFileSync(OUT, rows.map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n');
console.log(`Wrote ${rows.length - 1} rows from "${TAB}" to src/content/sheets/trip-planning.csv`);
console.log('Next: npm run validate-content');
