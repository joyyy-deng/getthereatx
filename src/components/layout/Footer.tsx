import { Link } from 'react-router-dom';
import { asset } from '../../lib/asset';
import { Logo } from './Logo';

// Figma "Footer" (787:6692, mobile 865:5802): logo + "Keep Austin Moving." on
// the left, a mist panel with the site directory, socials and legal line on the
// right. Phones stack the two. Contact and the social profiles are placeholder
// links in the prototype; Terms and Privacy are the City pages.
const DIRECTORY = [
  [
    { to: '/plan', label: 'Plan Your Trip' },
    { to: '/community', label: 'Community' },
  ],
  [
    { to: '/resources', label: 'Resources' },
    { to: '#contact', label: 'Contact' },
  ],
];

const SOCIAL = [
  { href: '#facebook', icon: '/icons/facebook.svg', label: 'Facebook' },
  { href: 'mailto:GetThereATX@austintexas.gov', icon: '/icons/email.svg', label: 'Email' },
  { href: '#instagram', icon: '/icons/instagram.svg', label: 'Instagram' },
];

const LEGAL = [
  { href: 'https://www.austintexas.gov/page/legal-notice', label: 'Terms' },
  { href: 'https://www.austintexas.gov/page/privacy-policy', label: 'Privacy Policy' },
];

export function Footer() {
  return (
    <footer className="flex flex-col border-t border-rule lg:flex-row">
      <div className="flex flex-col gap-6 p-6 lg:w-[560px] lg:shrink-0 lg:gap-8 lg:py-10 lg:pl-16 lg:pr-12">
        <Logo className="w-[248px] lg:w-[330px]" />
        <Link
          to="/plan"
          className="group flex items-end gap-6 text-[36px] font-medium leading-[1.08] tracking-[-0.03em] text-ink lg:w-[432px] lg:text-[44px] lg:leading-[1.25] lg:tracking-[-0.04em]"
        >
          <span className="flex-1">
            Keep Austin
            <br />
            Moving.
          </span>
          <span
            aria-hidden="true"
            className="text-[64px] font-normal leading-none transition-transform duration-hover group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-5 bg-mist p-6 lg:gap-6 lg:pb-4 lg:pl-12 lg:pr-16 lg:pt-10">
        <div className="flex gap-5 lg:gap-12">
          {DIRECTORY.map((group, i) => (
            <ul key={i} className="m-0 flex flex-1 list-none flex-col gap-4 p-0 lg:gap-0">
              {group.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    className="block text-[18px] font-medium leading-[1.5] text-ink hover:underline lg:py-2 lg:text-[22px] lg:leading-[1.25]"
                  >
                    {l.label}
                  </Link>
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
                className="flex items-center gap-[5px] text-[12px] text-ink hover:underline lg:h-[44px] lg:gap-2 lg:text-[14px]"
              >
                <img src={asset(s.icon)} alt="" width={24} height={24} className="block size-6" />
                {s.label}
              </a>
            </li>
          ))}
        </ul>
        <hr className="m-0 h-px w-full border-0 bg-rule" />
        <div className="flex flex-col gap-5 text-[12px] leading-[1.5] text-ink-muted lg:flex-row lg:items-center lg:justify-between lg:text-[14px]">
          <p className="m-0">© 2026 Get There ATX. All rights reserved.</p>
          <ul className="m-0 flex list-none gap-6 p-0 lg:h-[44px] lg:items-center">
            {LEGAL.map((l) => (
              <li key={l.label}>
                <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {l.label}
                  <span className="sr-only"> (opens austintexas.gov in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
