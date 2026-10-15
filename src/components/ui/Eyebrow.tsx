import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';

/** Small uppercase mono label: "LEARN", "CONNECT", provider names. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx('m-0 font-mono text-eyebrow uppercase text-ink-muted', className)}>{children}</p>;
}
