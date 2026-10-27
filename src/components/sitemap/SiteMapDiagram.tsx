import { pageAnchor, pageLinks, type SiteMapRow } from '../../lib/sitemap';

const W = 1200;
const NODE_W = 170;
const NODE_H = 52;
const ROW_GAP = 120;
const OUTSIDE = ['Outside sites', 'Email'];
const GLOBAL = 'Every page';

/**
 * Boxes for pages, arrows for links between them (number = how many buttons or
 * links). Layout comes from the sheet: pages are ranked by how many clicks they
 * are from the nav, so new pages place themselves.
 */
export function SiteMapDiagram({ rows }: { rows: SiteMapRow[] }) {
  const links = pageLinks(rows);
  const pages = [...new Set(rows.map((r) => r.page))].filter((p) => p !== GLOBAL);

  // Clicks from the nav (breadth-first); pages nothing links to go on the last row.
  const level = new Map<string, number>([[GLOBAL, -1]]);
  const queue = [GLOBAL];
  while (queue.length) {
    const from = queue.shift()!;
    for (const l of links)
      if (l.from === from && pages.includes(l.to) && !level.has(l.to)) {
        level.set(l.to, level.get(from)! + 1);
        queue.push(l.to);
      }
  }
  level.delete(GLOBAL);
  // Pages nothing links to (like Page not found) share the deepest row.
  const deepest = Math.max(1, ...level.values());
  for (const p of pages) if (!level.has(p)) level.set(p, deepest);

  const pos = new Map<string, { x: number; y: number }>();
  pos.set(GLOBAL, { x: (W - 220) / 2, y: 40 });
  const byLevel = new Map<number, string[]>();
  for (const p of pages) byLevel.set(level.get(p)!, [...(byLevel.get(level.get(p)!) ?? []), p]);
  for (const [lv, names] of byLevel)
    names.forEach((n, i) => pos.set(n, { x: ((i + 1) * (W - 220)) / (names.length + 1), y: 40 + (lv + 1) * ROW_GAP }));
  const height = 40 + (Math.max(...byLevel.keys()) + 1) * ROW_GAP + 70;
  OUTSIDE.forEach((n, i) => pos.set(n, { x: W - 110, y: 40 + ((i + 1) * height) / 3 }));

  const nodes = [GLOBAL, ...pages, ...OUTSIDE.filter((n) => links.some((l) => l.to === n))];

  return (
    <div className="overflow-x-auto border border-border-strong bg-bg">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="block w-full min-w-[720px]"
        role="img"
        aria-label="Diagram of the pages and the links between them"
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
            <path d="M0 0 10 5 0 10z" fill="var(--color-ink-muted)" />
          </marker>
        </defs>
        {links.map((l) => {
          const a = pos.get(l.from);
          const b = pos.get(l.to);
          if (!a || !b) return null;
          // Bend each arrow a little so A→B and B→A don't sit on top of each other.
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const len = Math.hypot(dx, dy) || 1;
          // Links within one row arc below it so they don't hide behind the boxes.
          const bend = Math.abs(dy) < 1 ? 70 * Math.sign(dx) : 28;
          const cx = mx - (dy / len) * bend;
          const cy = my + (dx / len) * bend;
          // Stop at the box edge so the arrowhead shows.
          const t = 1 - (NODE_H / 2 + 6) / len;
          const ex = cx + (b.x - cx) * t;
          const ey = cy + (b.y - cy) * t;
          const outside = OUTSIDE.includes(l.to);
          return (
            <g key={`${l.from}-${l.to}`}>
              <path
                d={`M${a.x} ${a.y} Q${cx} ${cy} ${ex} ${ey}`}
                fill="none"
                stroke={outside ? 'var(--color-border)' : 'var(--color-ink-muted)'}
                strokeWidth={Math.min(1 + l.count / 3, 4)}
                markerEnd="url(#arrow)"
              />
              {!outside && (
                <g transform={`translate(${(a.x + 2 * cx + ex) / 4} ${(a.y + 2 * cy + ey) / 4})`}>
                  <circle r="11" fill="var(--color-bg)" stroke="var(--color-ink-muted)" />
                  <text textAnchor="middle" dy="4" fontSize="11" fill="var(--color-ink)">
                    {l.count}
                  </text>
                </g>
              )}
            </g>
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n)!;
          const outside = OUTSIDE.includes(n);
          const count = rows.filter((r) => r.page === n).length;
          return (
            <a key={n} href={outside ? undefined : `#${pageAnchor(n)}`}>
              <rect
                x={p.x - NODE_W / 2}
                y={p.y - NODE_H / 2}
                width={NODE_W}
                height={NODE_H}
                fill={n === GLOBAL ? 'var(--color-surface-muted)' : outside ? 'var(--color-bg)' : 'var(--color-ink)'}
                stroke="var(--color-ink)"
                strokeDasharray={outside ? '4 4' : undefined}
              />
              <text
                x={p.x}
                y={p.y - (outside ? 0 : 4)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fill={n === GLOBAL || outside ? 'var(--color-ink)' : '#fff'}
              >
                {n === GLOBAL ? 'Nav + footer (every page)' : n}
              </text>
              {!outside && (
                <text
                  x={p.x}
                  y={p.y + 14}
                  textAnchor="middle"
                  fontSize="11"
                  fill={n === GLOBAL ? 'var(--color-ink-muted)' : '#d4d4d8'}
                >
                  {count} clickable {count === 1 ? 'item' : 'items'}
                </text>
              )}
            </a>
          );
        })}
      </svg>
    </div>
  );
}
