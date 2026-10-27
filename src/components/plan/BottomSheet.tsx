import { useRef, useState, type PointerEvent, type ReactNode, type RefObject } from 'react';
import { cx } from '../../lib/cx';
import { NEXT_SNAP, type Snap } from './layout';

/** Phone results sheet (Airbnb-style): drag the top edge, or tap it, to move between peek, half and full. */
export function BottomSheet({
  snap,
  onSnap,
  heights,
  label,
  title,
  bodyRef,
  children,
}: {
  snap: Snap;
  onSnap: (snap: Snap) => void;
  heights: Record<Snap, number>;
  label: string;
  title: string;
  bodyRef: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  /** Live height while dragging; null when resting on a snap point. */
  const [drag, setDrag] = useState<number | null>(null);
  const start = useRef<{ y: number; h: number } | null>(null);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    start.current = { y: e.clientY, h: heights[snap] };
  }
  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    if (!start.current) return;
    const h = start.current.h + (start.current.y - e.clientY);
    setDrag(Math.min(heights.full, Math.max(heights.peek, h)));
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const s = start.current;
    if (!s) return;
    start.current = null;
    const moved = Math.abs(s.y - e.clientY);
    if (moved < 6) {
      onSnap(NEXT_SNAP[snap]);
    } else {
      const h = drag ?? heights[snap];
      const nearest = (Object.keys(heights) as Snap[]).reduce((a, b) =>
        Math.abs(heights[b] - h) < Math.abs(heights[a] - h) ? b : a,
      );
      onSnap(nearest);
    }
    setDrag(null);
  }

  return (
    <aside
      aria-label={label}
      className={cx(
        'absolute inset-x-0 bottom-0 z-[600] flex flex-col overflow-hidden bg-bg shadow-raised',
        drag === null && 'transition-[height] duration-panel ease-out',
      )}
      style={{ height: drag ?? heights[snap] }}
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          start.current = null;
          setDrag(null);
        }}
        className="shrink-0 cursor-grab touch-none select-none px-4 pb-3 pt-2"
      >
        <button
          type="button"
          aria-expanded={snap !== 'peek'}
          aria-label={snap === 'full' ? 'Show more of the map' : 'Show more results'}
          // Pointer taps are handled above; this covers keyboard Enter / Space.
          onClick={(e) => e.detail === 0 && onSnap(NEXT_SNAP[snap])}
          className="mx-auto flex h-6 w-16 items-center justify-center"
        >
          <span aria-hidden="true" className="block h-1 w-10 rounded-pill bg-border-control" />
        </button>
        <h2 className="m-0 mx-auto max-w-[560px] text-h4 text-ink">{title}</h2>
      </div>
      <div
        ref={bodyRef}
        className="mx-auto flex min-h-0 w-full max-w-[592px] flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 pb-8"
      >
        {children}
      </div>
    </aside>
  );
}
