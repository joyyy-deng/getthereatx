import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';

// Figma "Nav Bar" (327:918): logo left, three links right, 64px apart.
// Below 768px (Figma "Mobile Design"): logo + hamburger that opens the links.
const LINKS = [
  { to: '/plan', label: 'Plan Your Trip' },
  { to: '/community', label: 'Community' },
  { to: '/resources', label: 'Resources' },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-[1100] bg-bg px-6 md:px-8">
      <nav aria-label="Main" className="mx-auto flex max-w-frame items-center justify-between py-[10px] md:py-4">
        <Link to="/" aria-label="Get There ATX home" className="block">
          <Logo src="/brand/logo-nav.png" />
        </Link>
        <ul className="m-0 hidden list-none items-center gap-16 p-0 md:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cx('block text-nav text-ink underline-offset-8 decoration-1 hover:underline', isActive && 'underline')
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
          className="-mr-2 grid size-[44px] place-items-center text-ink md:hidden"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>
      {open && (
        <ul
          id="mobile-menu"
          className="m-0 -mx-6 list-none border-t border-border bg-bg px-6 pb-4 pt-2 shadow-raised md:hidden"
        >
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cx('block py-3 text-nav text-ink underline-offset-8 decoration-1', isActive && 'underline')
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
