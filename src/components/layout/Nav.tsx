import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';

// Figma "Nav" (desktop 860:1645, mobile "Mobile navigation"): logo left; from
// 1024px three full-height tabs on the right, the current page tinted sky.
// Below 1024px: logo + menu button that opens the links.
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
    <header className="sticky top-0 z-[1100] border-b border-rule bg-bg lg:border-b-2">
      <nav aria-label="Main" className="flex h-[72px] items-center justify-between px-page lg:h-[84px]">
        <Link to="/" aria-label="Get There ATX home" className="block">
          <Logo className="w-[190px] lg:w-[240px]" />
        </Link>
        <ul className="m-0 hidden h-full list-none items-stretch p-0 lg:flex">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cx(
                    'flex h-full items-center px-7 text-menu text-rule transition-colors duration-hover',
                    isActive ? 'bg-sky-nav font-normal' : 'font-medium hover:bg-mist',
                  )
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
          className="-mr-[10px] grid size-[44px] place-items-center text-ink lg:hidden"
        >
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            ) : (
              <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </nav>
      {open && (
        <ul id="mobile-menu" className="m-0 list-none border-t border-line bg-bg p-0 shadow-raised lg:hidden">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cx('block px-[var(--page-gutter)] py-4 text-menu font-medium text-ink', isActive && 'bg-sky-nav font-normal')
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
