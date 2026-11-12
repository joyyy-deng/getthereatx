import { useId } from 'react';
import { cx } from '../../lib/cx';

/**
 * Figma "Filter control": outlined box with a label and a chevron. A native
 * <select> underneath, so it works with keyboards, screen readers and phone
 * pickers. The first option is the "no filter" choice (value "").
 */
export function FilterSelect({
  label,
  value,
  options,
  onChange,
  className,
}: {
  /** Screen-reader name and the text shown while nothing is picked. */
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cx(
        // The select hides its own outline, so the box shows keyboard focus.
        'relative h-12 border border-line bg-bg focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-full cursor-pointer appearance-none bg-transparent pl-[14px] pr-12 text-fine text-ink outline-none lg:pl-[18px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        className="pointer-events-none absolute right-3 top-1/2 size-6 -translate-y-1/2 text-ink"
      >
        <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
