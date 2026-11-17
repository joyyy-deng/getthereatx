import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { pageHref } from '../../lib/pageLinks';

/** A link to another GetThereATX page: a router Link in the prototype, a plain <a> inside WordPress. */
export function PageLink({
  to,
  className,
  children,
  label,
  onClick,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  /** aria-label, when the visible text isn't enough on its own. */
  label?: string;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const href = pageHref(to);
  if (href !== null) {
    return (
      <a href={href} className={className} aria-label={label} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={className} aria-label={label} onClick={onClick}>
      {children}
    </Link>
  );
}
