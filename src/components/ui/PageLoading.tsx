import type { CSSProperties } from 'react';

/** Holds the page's space while its content loads. */
export function PageLoading({ className = 'min-h-screen', style }: { className?: string; style?: CSSProperties }) {
  return <div className={className} style={style} aria-busy="true" />;
}
