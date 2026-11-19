import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { NAV_LINKS } from './siteLinks';

// Figma "Nav" component (860:1645): 72px tall, logo 188 × 36 at 16px from the
// edge, three tabs of 16/24px Real Text Demibold with 24px padding and 4px
// apart, the current page tinted sky (#d9e8f4). No rule under it.
// Phones and tablets (Figma "Mobile navigation" 865:6072): 80px bar, 24px side
// padding, 1px rule, logo and the menu icon; the menu opens a full panel (MobileMenu).

export function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const button = useRef<HTMLButtonElement>(null);

  // Close the menu after navigating.
  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="sticky top-0 z-[1100] bg-bg">
      <nav aria-label="Main" className="flex h-[80px] items-center justify-between border-b border-rule px-6 py-2 lg:h-[72px] lg:border-b-0 lg:p-0">
        <Link to="/" aria-label="Get There ATX home" className="block lg:px-4">
          <Logo className="w-[210px] lg:hidden" />
          <Logo crop="nav" className="hidden w-[188px] lg:block" />
        </Link>
        <ul className="m-0 hidden h-full list-none items-stretch gap-1 p-0 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                className={({ isActive }) =>
                  cx(
                    'relative isolate flex h-full items-center overflow-hidden whitespace-nowrap p-6 text-[16px] font-semibold leading-[24px] text-ink',
                    // Hover: the green slant wash (index.css .btn-slant). The current page
                    // stays leaf, the color the hover ends on (Joy 2026-11-19; was sky).
                    isActive ? 'bg-leaf' : 'btn-slant',
                  )
                }
              >
                {l.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <button
          ref={button}
          type="button"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
          className="-mr-[10px] grid size-[44px] place-items-center text-ink lg:hidden"
        >
          {open ? (
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <img src={asset('/icons/menu.svg')} alt="" width={24} height={24} className="block size-6" />
          )}
        </button>
      </nav>
      {open && <MobileMenu onClose={() => { setOpen(false); button.current?.focus(); }} />}
    </header>
  );
}
