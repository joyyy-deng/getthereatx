// Sizes shared by the Plan Your Trip page, its results panel and the phone sheet.

/** Desktop results panel width. Narrower than the Figma's 588px so more map shows. */
export const PANEL_W = 480;

/** Below 1024px the results move into a bottom sheet over a full-screen map. */
export const MOBILE_QUERY = '(max-width: 1023px)';

export type Snap = 'peek' | 'half' | 'full';
const PEEK_H = 132;

/** Sheet height for each snap point. Full stops just under the From/To card. */
export function sheetHeights(sectionH: number, formBottom: number): Record<Snap, number> {
  const full = Math.max(PEEK_H, sectionH - formBottom - 8);
  return { peek: PEEK_H, half: Math.min(full, Math.round(sectionH * 0.5)), full };
}

/** Where a tap on the sheet's handle goes next. */
export const NEXT_SNAP: Record<Snap, Snap> = { peek: 'half', half: 'full', full: 'half' };
