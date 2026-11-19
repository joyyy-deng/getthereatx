import { Link } from 'react-router-dom';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { Logo } from './Logo';
import { Arrow } from '../ui/Arrow';
import { DIRECTORY, LEGAL, MAILING_LIST, SOCIAL } from './siteLinks';

// Figma "Footer" components (desktop 1117:4256, phone 1117:4216).
//   Desktop: 1px rule on top. Left (560 of 1440): logo 330 × 106 at 64/40, then
//   "Keep Austin Moving." 32px Demibold (no arrow). Right: sky (#d9e8f4) panel,
//   40/64/16/48 padding, 24 apart: two link columns (22/28 Demibold navy, 44px
//   rows, 48 apart), socials (14/20 Demibold navy), a navy rule, the legal line.
//   Phone: logo 248 × 80, invitation 22/28 Demibold, then the sky panel
//   (24 padding, 20 apart): links 16/24 Demibold, socials and legal 12/16.

const linkClass = 'hover:underline';

function DirectoryLink({ l }: { l: (typeof DIRECTORY)[number][number] }) {
  const cls = cx(linkClass, 'flex items-center text-fluid [--m:16] [--d:22] font-semibold leading-[24px] tracking-[0.01em] text-navy lg:h-[44px] lg:leading-[28px] lg:tracking-normal');
  if ('to' in l) {
    return (
      <Link to={l.to} className={cls}>
        {l.label}
      </Link>
    );
  }
  return (
    <a href={l.href} target="_blank" rel="noopener noreferrer" className={cls}>
      {l.label}
      <span className="sr-only"> (opens getthereatx.com in a new tab)</span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="flex flex-col border-t border-rule lg:flex-row">
      <div className="flex flex-col gap-6 p-6 lg:w-[38.9%] lg:shrink-0 lg:gap-3 lg:px-16 lg:pb-10 lg:pt-10">
        <Logo className="w-[248px] lg:w-[330px]" />
        <p className="m-0 text-fluid [--m:22] [--d:32] font-semibold leading-[28px] text-ink lg:leading-[1.15] lg:tracking-[-0.01em]">
          Keep Austin
          <br />
          Moving.
        </p>
        {/* Mailing list (Joy, 2026-11-19): the site's leaf button, under the invitation. */}
        <a
          href={MAILING_LIST.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[44px] w-fit items-center gap-3 bg-leaf px-5 text-[14px] font-semibold leading-[20px] tracking-[0.01em] text-ink transition-opacity duration-hover hover:opacity-90 lg:mt-3"
        >
          {MAILING_LIST.label}
          <Arrow className="size-3" strokeWidth={2.5} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>

      <div className="flex flex-1 flex-col gap-5 bg-sky p-6 lg:gap-6 lg:pb-4 lg:pl-12 lg:pr-16 lg:pt-10">
        <div className="flex gap-5 lg:gap-12">
          {DIRECTORY.map((group, i) => (
            <ul key={i} className="m-0 flex flex-1 list-none flex-col gap-4 p-0 lg:gap-0">
              {group.map((l) => (
                <li key={l.label}>
                  <DirectoryLink l={l} />
                </li>
              ))}
            </ul>
          ))}
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0">
          {SOCIAL.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                {...(s.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                className={cx(
                  linkClass,
                  'flex min-h-[44px] items-center gap-[5px] text-[12px] leading-[16px] tracking-[0.01em] text-navy lg:h-[44px] lg:gap-2 lg:text-[14px] lg:font-semibold lg:leading-[20px]',
                )}
              >
                <img src={asset(s.icon)} alt="" width={24} height={24} className="block size-6" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <hr className="m-0 h-px w-full border-0 bg-navy" />
        <div className="flex flex-col gap-5 text-[12px] leading-[16px] tracking-[0.01em] text-ink-muted lg:flex-row lg:items-center lg:justify-between lg:text-[14px] lg:font-semibold lg:leading-[20px]">
          <p className="m-0">© 2026 Get There ATX. All rights reserved.</p>
          <ul className="m-0 flex list-none gap-6 p-0 lg:h-[44px] lg:items-center">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {l.label}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
