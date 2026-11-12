import type { ConnectCard, Resource } from '../content/schema';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { track } from '../lib/track';
import { cx } from '../lib/cx';
import { Arrow } from './ui/Arrow';
import { PageLink } from './ui/PageLink';

/**
 * Figma's exact sizes (phone 393 / desktop 1440): Home "Community invitation"
 * (title 32/72, button 14/16, card title 24/36, card text 16/21) and Community
 * (title 48/45, button 14/14, card title 24/28, card text 16/16).
 */
const SIZES = {
  home: { pad: 'px-page', col: 'lg:w-[32%]', title: '[--m:32] [--d:72] leading-[0.98]', button: '[--m:14] [--d:16]', card: '[--m:24] [--d:36] leading-[1.1]', body: '[--m:16] [--d:21] leading-[1.3]' },
  community: { pad: 'px-article', col: 'lg:w-[44%]', title: '[--m:48] [--d:45] leading-[1.05]', button: '[--m:14] [--d:14]', card: '[--m:24] [--d:28] leading-[1.15]', body: '[--m:16] [--d:16] leading-[1.5]' },
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
}: {
  variant?: keyof typeof SIZES;
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
    <section className={cx('bg-navy py-10 lg:py-16', size.pad)}>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16">
        <div className={cx('flex flex-col items-start gap-6 lg:shrink-0', size.col)}>
          <Heading className={cx('m-0 text-fluid font-semibold tracking-[-0.04em] text-mist', size.title)}>
            {title}
          </Heading>
          <PageLink
            to={button.to}
            className={cx('flex min-h-[56px] items-center gap-7 bg-leaf px-5 text-fluid font-bold leading-[20px] text-ink transition-opacity duration-hover hover:opacity-90', size.button)}
          >
            {button.label}
            <Arrow className="size-3" strokeWidth={2.5} />
          </PageLink>
        </div>
        <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-3 lg:flex-1 lg:gap-[6px]">
          {cards.map((c) => {
            const r = resources.get(c.resourceId);
            return (
              <li key={c.id} className="flex">
                <a
                  href={r?.url ?? '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={r ? `${text(c.title)}: ${r.action}, opens ${r.provider} in a new tab` : undefined}
                  onClick={() => r && track('handoff', { resourceId: r.id, from, provider: r.provider, href: r.url })}
                  className="group flex w-full flex-col overflow-hidden border border-sky bg-mist"
                >
                  <span className="block h-[200px] overflow-hidden bg-sky">
                    <img
                      src={asset(c.image.src)}
                      alt={c.image.alt}
                      className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                    />
                  </span>
                  <span className="flex flex-col gap-[10px] p-6">
                    <span className={cx('text-fluid font-bold tracking-[-0.03em] text-ink', size.card)}>
                      {text(c.title)}
                    </span>
                    <span className={cx('flex items-center gap-2 text-fluid text-navy', size.body)}>
                      {text(c.body)}
                      <Arrow className="size-3" />
                    </span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
