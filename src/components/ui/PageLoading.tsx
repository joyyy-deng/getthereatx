/** Holds the page's space while its content loads. */
export function PageLoading({ className = 'min-h-screen' }: { className?: string }) {
  return <div className={className} aria-busy="true" />;
}
