import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { pageHref } from '../../lib/pageLinks';

/** A link to another GetThereATX page: a router Link in the prototype, a plain <a> inside WordPress. */
export function PageLink({ to, className, children }: { to: string; className?: string; children: ReactNode }) {
  const href = pageHref(to);
  if (href !== null) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
