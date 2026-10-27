import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { asset } from '../../lib/asset';

// Figma "Footer" (327:947). Contact and the social profiles are placeholder
// links in the prototype; Terms and Privacy are the City pages the Figma uses.
const PAGE_LINKS = [
  { to: '/plan', label: 'Plan your trip' },
  { to: '/resources', label: 'Resources' },
  { to: '#contact', label: 'Contact' },
];

const SOCIAL = [
  { href: '#facebook', icon: '/icons/facebook.svg', label: 'Get There ATX on Facebook' },
  { href: 'mailto:GetThereATX@austintexas.gov', icon: '/icons/email.svg', label: 'Email Get There ATX' },
  { href: '#instagram', icon: '/icons/instagram.svg', label: 'Get There ATX on Instagram' },
];

const LEGAL = [
  { href: 'https://www.austintexas.gov/page/legal-notice', label: 'Terms' },
  { href: 'https://www.austintexas.gov/page/privacy-policy', label: 'Privacy Policy' },
];

const label = 'text-label uppercase text-ink';

export function Footer() {
  return (
    <footer className="px-6 md:px-8">
      <div className="mx-auto flex max-w-frame flex-col gap-6 py-8">
        <hr className="m-0 h-px w-full border-0 bg-border-strong" />
        {/* Below 1024px (Figma mobile): logo, links stacked, socials and legal centered. */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="contents lg:flex lg:flex-col lg:gap-4">
            <Logo src="/brand/logo-footer.png" />
            <p className={`order-last m-0 text-center lg:order-none lg:whitespace-pre lg:text-left ${label}`}>
              <span className="block lg:inline">{'© 2026 Get There ATX. All Rights Reserved.  |  '}</span>
              {LEGAL.map((l, i) => (
                <span key={l.href}>
                  {i > 0 && '  |  '}
                  <a href={l.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {l.label}
                    <span className="sr-only"> (opens austintexas.gov in a new tab)</span>
                  </a>
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
            <ul className="m-0 flex list-none flex-col gap-3 p-0 lg:flex-row lg:gap-12">
              {PAGE_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={`${label} hover:underline`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="m-0 flex list-none justify-center gap-4 p-0">
              {SOCIAL.map((s) => (
                <li key={s.href}>
                  <a href={s.href} aria-label={s.label} className="block size-6">
                    <img src={asset(s.icon)} alt="" width={24} height={24} className="block size-6" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
