import type { ConnectCard, Resource } from '../content/schema';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { track } from '../lib/track';
import { cx } from '../lib/cx';
import { Arrow } from './ui/Arrow';
import { PageLink } from './ui/PageLink';

/**
 * Figma's exact sizes (phone 393 / desktop 1440): Home v1 "Community invitation"
 * (775:3329 / 865:5778: title 32/57, white button on desktop, cards 395 tall with
 * a 230px picture) and Community (860:1755: title 48/45, green button, cards
 * 295 tall). Card details: 165px, 24 padding, title 24/28, text 16/24.
 */
const SIZES = {
  home: {
    title: '[--m:32] [--d:57] leading-[1.15] lg:leading-[1.05]',
    button: 'bg-white',
    card: 'flex-row sm:flex-col lg:h-[395px]',
    pic: 'h-[131px] min-w-0 flex-1 sm:h-[200px] sm:flex-none lg:h-[230px]',
    details: 'w-[240px] shrink-0 sm:w-auto',
  },
  community: {
    title: '[--m:48] [--d:45] leading-[1.05]',
    button: 'bg-white',
    card: 'flex-row sm:flex-col lg:h-[295px]',
    pic: 'w-[76px] shrink-0 sm:h-[200px] sm:w-auto lg:h-auto lg:min-h-0 lg:flex-1',
    details: 'justify-center sm:justify-start',
  },
};

/**
 * Figma "Community invitation" (787:6667): navy band with "Get there
 * together.", a green button, and the Students / Seniors / Families cards.
 * Each card hands off to its program (connect-cards.json → resources.json).
 */
export function TogetherBand({
  title,
  button,
  cards,
  resources,
  from,
  headingLevel = 2,
  variant = 'home',
  bodies,
}: {
  variant?: keyof typeof SIZES;
  /** Card lines that differ on this page (connect-card id → text). */
  bodies?: Record<string, string>;
  title: string;
  button: { label: string; to: string };
  cards: ConnectCard[];
  resources: Map<string, Resource>;
  from: string;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  const size = SIZES[variant];
  return (
    <section className="bg-navy px-article py-10 lg:py-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex flex-col items-start gap-6 lg:w-[38.6%] lg:shrink-0">
          <Heading className={cx('m-0 text-fluid font-semibold tracking-[-0.01em] text-sky lg:text-white', size.title)}>
            {title}
          </Heading>
          <PageLink
            to={button.to}
            className={cx(
              'flex min-h-[56px] items-center gap-7 px-5 text-[14px] font-semibold leading-[20px] tracking-[0.01em] text-ink btn-slant',
              size.button,
            )}
          >
            {button.label}
            <Arrow className="size-3" />
          </PageLink>
        </div>
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3 lg:flex-1 lg:gap-[6px]">
          {cards.map((c) => {
            const r = resources.get(c.resourceId);
            return (
              <li key={c.id} className="flex">
                {r?.postSlug ? (
                  // Our own guide (Bike Bus): its rebuilt guide page on this site, not the old getthereatx.com page.
                  <PageLink
                    to={`/guides/${r.postSlug}`}
                    className={cx('group flex w-full overflow-hidden bg-white transition-colors duration-hover hover:bg-sky focus-visible:bg-sky', size.card)}
                  >
                    <span className={cx('block overflow-hidden bg-sky', size.pic)}>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={asset(c.image.src)}
                        alt={c.image.alt}
                        className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                      />
                    </span>
                    <span className={cx('flex flex-col gap-[10px] p-6 lg:h-[165px] lg:shrink-0', size.details)}>
                      <span className="text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:28] [--m:24]">
                        {text(c.title)}
                      </span>
                      <span className="text-[16px] leading-[24px] tracking-[0.01em] text-navy">
                        {bodies?.[c.id] ?? text(c.body)}
                      </span>
                    </span>
                  </PageLink>
                ) : (
                  <a
                    href={r?.url ?? '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={r ? `${text(c.title)}: ${r.action}, opens ${r.provider} in a new tab` : undefined}
                    onClick={() => r && track('handoff', { resourceId: r.id, from, provider: r.provider, href: r.url })}
                    className={cx('group flex w-full overflow-hidden bg-white transition-colors duration-hover hover:bg-sky focus-visible:bg-sky', size.card)}
                  >
                    <span className={cx('block overflow-hidden bg-sky', size.pic)}>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={asset(c.image.src)}
                        alt={c.image.alt}
                        className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                      />
                    </span>
                    <span className={cx('flex flex-col gap-[10px] p-6 lg:h-[165px] lg:shrink-0', size.details)}>
                      <span className="text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-ink [--d:28] [--m:24]">
                        {text(c.title)}
                      </span>
                      <span className="text-[16px] leading-[24px] tracking-[0.01em] text-navy">
                        {bodies?.[c.id] ?? text(c.body)}
                      </span>
                    </span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
