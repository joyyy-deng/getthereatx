/**
 * Motion Lab "Lift and roll": each digit is a 0–9 column that rolls to the new
 * number. Columns are keyed by place value (ones, tens…), so going 28 → 35 rolls
 * both digits and 9 → 12 adds a tens column. Screen readers get the plain number
 * (the columns hold all ten digits, so they're hidden from them).
 */
export function RollingNumber({ value }: { value: number }) {
  const digits = String(Math.max(0, Math.round(value))).split('');
  return (
    <span className="inline-flex">
      <span className="sr-only">{Math.round(value)}</span>
      {digits.map((d, i) => (
        <span
          key={digits.length - i}
          aria-hidden="true"
          className="inline-block h-[1.1em] overflow-hidden leading-[1.1em]"
        >
          <span className="roll-col flex flex-col" style={{ transform: `translateY(${-Number(d) * 1.1}em)` }}>
            {'0123456789'.split('').map((n) => (
              <span key={n}>{n}</span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}
