// The client keeps the Resources directory in a Google Sheet ("Website Content",
// tab "Trip Planning"). Download that tab as CSV into content/sheets/ and this
// file turns it into directory entries. Nothing here adds or rewrites content:
// cells are only trimmed and split into lists.

/** Parse CSV text (RFC 4180: quoted fields, "" escapes, line breaks inside quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  // Google Sheets exports can start with a byte-order mark (U+FEFF).
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

/**
 * A comma-separated cell as a list. Values that contain a comma are wrapped in
 * quotes in the sheet, e.g. `Biking, "Carpooling, Van or Car/Rideshare"`.
 */
function splitList(cell: string): string[] {
  return (parseCsv(cell.trim())[0] ?? []).map((v) => v.trim()).filter(Boolean);
}

/** The sheet's column headings, exactly as the client wrote them (spaces trimmed). */
export const SHEET_COLUMNS = {
  name: 'Resources',
  forWho: 'For Who?',
  types: 'Type',
  description: 'Description',
  link: 'Link',
} as const;

export interface DirectoryEntry {
  /** Made from the name and row, so duplicate names stay distinct. */
  id: string;
  /** Row number in the sheet (header is row 1), for error messages. */
  row: number;
  name: string;
  forWho: string[];
  types: string[];
  description: string;
  /** Only set when the Link cell holds a web address. */
  url?: string;
  /** The Link cell as written. */
  linkCell: string;
}

export interface SheetResult {
  entries: DirectoryEntry[];
  /** Problems that stop the sheet from loading (missing columns, empty names). */
  errors: string[];
  /** Things to fix in the sheet that don't break the site. */
  warnings: string[];
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function readTripPlanningSheet(csv: string): SheetResult {
  const [header = [], ...rows] = parseCsv(csv);
  const errors: string[] = [];
  const warnings: string[] = [];
  const col = Object.fromEntries(
    Object.entries(SHEET_COLUMNS).map(([key, heading]) => {
      const i = header.findIndex((h) => h.trim() === heading);
      if (i < 0) errors.push(`missing column "${heading}"`);
      return [key, i];
    }),
  ) as Record<keyof typeof SHEET_COLUMNS, number>;
  if (errors.length) return { entries: [], errors, warnings };

  const seen = new Map<string, number>();
  const entries = rows.map((cells, i): DirectoryEntry => {
    const row = i + 2;
    const cell = (key: keyof typeof SHEET_COLUMNS) => (cells[col[key]] ?? '').trim();
    const name = cell('name');
    const linkCell = cell('link');
    const url = /^https?:\/\/\S+$/.test(linkCell) ? linkCell : undefined;
    const entry: DirectoryEntry = {
      id: `${slug(name) || 'row'}-${row}`,
      row,
      name,
      forWho: splitList(cell('forWho')),
      types: splitList(cell('types')),
      description: cell('description'),
      url,
      linkCell,
    };

    if (!name) errors.push(`row ${row}: no name in "${SHEET_COLUMNS.name}"`);
    if (!entry.description) errors.push(`row ${row} (${name}): no description`);
    if (!url)
      warnings.push(
        linkCell
          ? `row ${row} (${name}): Link is "${linkCell}", not a web address, so no button shows`
          : `row ${row} (${name}): no Link, so no button shows`,
      );
    if (!entry.forWho.length) warnings.push(`row ${row} (${name}): "For Who?" is empty`);
    if (!entry.types.length) warnings.push(`row ${row} (${name}): "Type" is empty`);
    const key = name.toLowerCase();
    if (seen.has(key)) warnings.push(`row ${row} (${name}): same name as row ${seen.get(key)}`);
    else seen.set(key, row);
    return entry;
  });
  return { entries, errors, warnings };
}
