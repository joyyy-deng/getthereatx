import { Link, NavLink } from 'react-router-dom';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';

// Figma "Nav Bar" (327:918): logo left, three links right, 64px apart.
const LINKS = [
  { to: '/plan', label: 'Plan Your Trip' },
  { to: '/community', label: 'Community' },
  { to: '/resources', label: 'Resources' },
];

export function Nav() {
  return (
    <header className="sticky top-0 z-[1100] bg-bg px-8">
      <nav aria-label="Main" className="mx-auto flex max-w-frame items-center justify-between py-4">
        <Link to="/" aria-label="Get There ATX home" className="block">
          <Logo src="/brand/logo-nav.png" />
        </Link>
        <ul className="m-0 flex list-none items-center gap-16 p-0">
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
      </nav>
    </header>
  );
}
