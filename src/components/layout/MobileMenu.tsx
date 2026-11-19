import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router-dom';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { DIRECTORY, LEGAL, NAV_LINKS, SOCIAL } from './siteLinks';

/**
 * The phone and tablet menu (no Figma frame; designed from the system, Joy
 * 2026-11-12): fills the screen under the 80px bar. The three pages in large
 * Demibold type (Figma Headline/Large, 32/1.15), one per row on rules, the
 * current page tinted sky as in the desktop nav; then the footer's mist panel
 * with Contact, the socials and the legal links.
 * Escape closes it, focus starts on the first link, and the page behind
 * doesn't scroll while it's open.
 */
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const first = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  const contact = DIRECTORY[1][1];
  return (
    <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-[80px] flex flex-col overflow-y-auto bg-bg lg:hidden">
      <ul className="m-0 list-none p-0">
        {NAV_LINKS.map((l, i) => (
          <li key={l.to} className="border-b border-rule">
            <NavLink
              ref={i === 0 ? first : undefined}
              to={l.to}
              className={({ isActive }) =>
                cx(
                  'flex min-h-[72px] items-center justify-between px-6 py-4 text-[32px] font-semibold leading-[1.15] tracking-[-0.01em] text-ink',
                  isActive ? 'bg-sky-nav' : 'hover:bg-sky',
                )
              }
            >
              {l.label}
              <img src={asset('/images/icons/arrow-up-right.svg')} alt="" width={16} height={16} className="block size-4" />
            </NavLink>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-5 bg-mist p-6">
        <a href={contact.href} target="_blank" rel="noopener noreferrer" className="text-[16px] font-semibold leading-[24px] tracking-[0.01em] text-ink">
          <span className="u-draw">{contact.label}</span>
          <span className="sr-only"> (opens getthereatx.com in a new tab)</span>
        </a>
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
          {SOCIAL.map((s) => (
            <li key={s.label}>
              <a href={s.href} className="flex min-h-[44px] items-center gap-[5px] text-[12px] leading-[16px] tracking-[0.01em] text-ink">
                <img src={asset(s.icon)} alt="" width={24} height={24} className="block size-6" />
                <span className="u-draw">{s.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <ul className="m-0 flex list-none gap-6 p-0 text-[12px] leading-[16px] tracking-[0.01em] text-ink-muted">
          {LEGAL.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center">
                <span className="u-draw">{l.label}</span>
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
