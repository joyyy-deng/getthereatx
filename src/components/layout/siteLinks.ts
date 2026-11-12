// Every link in the nav, the phone menu and the footer, in one place.
// Labels are Figma's: the nav tabs say "Plan your trip" (sentence case), the
// footer directory says "Plan Your Trip" (title case).

export const NAV_LINKS = [
  { to: '/plan', label: 'Plan your trip' },
  { to: '/community', label: 'Community' },
  { to: '/resources', label: 'Resources' },
];

/** Footer directory, two columns as in Figma. Contact is getthereatx.com's own page. */
export const DIRECTORY = [
  [
    { to: '/plan', label: 'Plan Your Trip' },
    { to: '/community', label: 'Community' },
  ],
  [
    { to: '/resources', label: 'Resources' },
    { href: 'https://www.getthereatx.com/contact/', label: 'Contact' },
  ],
] as const;

export const SOCIAL = [
  { href: '#facebook', icon: '/icons/facebook.svg', label: 'Facebook' },
  { href: 'mailto:GetThereATX@austintexas.gov', icon: '/icons/email.svg', label: 'Email' },
  { href: '#instagram', icon: '/icons/instagram.svg', label: 'Instagram' },
];

/**
 * Privacy Policy is getthereatx.com's own page. The site has no Terms page, so
 * Terms stays on the City of Austin's legal notice (flagged for the client).
 */
export const LEGAL = [
  { href: 'https://www.austintexas.gov/page/legal-notice', label: 'Terms' },
  { href: 'https://www.getthereatx.com/privacy-policy/', label: 'Privacy Policy' },
];
