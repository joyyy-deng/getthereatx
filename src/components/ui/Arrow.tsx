import { cx } from '../../lib/cx';

/**
 * The site's arrows, from Joy's Semibold arrow set (2026-11-19; the source SVGs are in
 * public/images/icons/arrows/). Drawn in the text color; size them with a class.
 *
 * Arrow is the angled ↗ on every link and button. Motion Lab "Exit and return": it draws two
 * arrows in a clipped box, so when its link, button or hover card (.group) is hovered the first
 * flies out to the top right and the second comes in from the bottom left (index.css
 * .arrow-exit). `still` turns that off.
 */
const STROKE = { stroke: 'currentColor', strokeWidth: 30.03, strokeLinecap: 'square', strokeMiterlimit: 7.2 } as const;

function UpRight({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 179.89 179.89" fill="none" className={className}>
      <g {...STROKE}>
        <line x1="21.23" y1="158.66" x2="153.86" y2="26.03" />
        <polyline points="37.02 15.01 164.88 15.01 164.88 142.87" />
      </g>
    </svg>
  );
}

export function Arrow({ className = 'size-4', still = false }: { className?: string; still?: boolean }) {
  if (still) return <UpRight className={cx('block shrink-0', className)} />;
  return (
    <span aria-hidden="true" className={cx('arrow-exit relative block shrink-0 overflow-hidden', className)}>
      <UpRight />
      <UpRight />
    </span>
  );
}

/** ← (back links). */
export function ArrowLeft({ className = 'size-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 239.39 223.28" fill="none" className={cx('block shrink-0', className)}>
      <g {...STROKE}>
        <line x1="224.37" y1="111.64" x2="36.81" y2="111.64" />
        <polyline points="111.64 202.04 21.23 111.64 111.64 21.23" />
      </g>
    </svg>
  );
}

/** ↑ (the map's north button). */
export function ArrowUp({ className = 'size-4' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 223.28 239.39" fill="none" className={cx('block shrink-0', className)}>
      <g {...STROKE}>
        <line x1="111.64" y1="224.37" x2="111.64" y2="36.81" />
        <polyline points="21.23 111.64 111.64 21.23 202.04 111.64" />
      </g>
    </svg>
  );
}
