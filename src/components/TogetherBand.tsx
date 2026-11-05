import type { ConnectCard, Resource } from '../content/schema';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { track } from '../lib/track';
import { PageLink } from './ui/PageLink';

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
}: {
  title: string;
  button: { label: string; to: string };
  cards: ConnectCard[];
  resources: Map<string, Resource>;
  from: string;
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <section className="bg-navy px-6 py-10 lg:p-16">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-16">
        <div className="flex flex-col items-start gap-6 lg:w-[457px] lg:shrink-0">
          <Heading className="m-0 text-[48px] font-semibold leading-[1.08] tracking-[-0.03em] text-mist lg:text-[72px] lg:leading-[0.98] lg:tracking-[-0.04em]">
            {title}
          </Heading>
          <PageLink
            to={button.to}
            className="flex min-h-[56px] items-center gap-2 bg-leaf px-4 text-[14px] font-medium text-ink transition-opacity duration-hover hover:opacity-90 lg:gap-7 lg:px-5 lg:text-[16px] lg:font-bold"
          >
            {button.label}
            <span aria-hidden="true" className="text-[20px] font-normal">
              →
            </span>
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
                  <span className="block h-[230px] overflow-hidden bg-sky">
                    <img
                      src={asset(c.image.src)}
                      alt={c.image.alt}
                      className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]"
                    />
                  </span>
                  <span className="flex flex-col gap-[10px] p-6">
                    <span className="text-[36px] font-bold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[28px] xl:text-[36px]">
                      {text(c.title)}
                    </span>
                    <span className="text-[21px] leading-[1.3] text-navy">
                      {text(c.body)} <span aria-hidden="true">↗</span>
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
