import { cx } from '../../lib/cx';

export interface PaginationProps {
  page: number;
  pages: number;
  onChange: (page: number) => void;
  label: string;
}

/** Page numbers to show: all when few, else first, last and the current page's neighbors. */
function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = [...new Set([1, current - 1, current, current + 1, total])]
    .filter((n) => n >= 1 && n <= total)
    .sort((a, b) => a - b);
  return shown.flatMap((n, i) => (i > 0 && n - shown[i - 1] > 1 ? ['…' as const, n] : [n]));
}

const arrow =
  'grid size-[44px] place-items-center text-[20px] text-ink transition-colors duration-hover hover:bg-sky disabled:opacity-30';

/** ‹ 1 2 … 7 › with square page boxes, styled like the Resources filters (charcoal = current). */
export function Pagination({ page, pages, onChange, label }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <nav aria-label={label} className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
        className={arrow}
      >
        <span aria-hidden="true">‹</span>
      </button>
      {pageList(page, pages).map((n, i) =>
        n === '…' ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-small text-ink-muted">
            …
          </span>
        ) : (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`Page ${n}`}
            aria-current={n === page ? 'page' : undefined}
            className={cx(
              'grid size-[44px] place-items-center border text-fine transition-colors duration-hover',
              n === page ? 'border-charcoal bg-charcoal text-white' : 'border-line text-ink hover:bg-sky',
            )}
          >
            {n}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === pages}
        aria-label="Next page"
        className={arrow}
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
