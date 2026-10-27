import { useState } from 'react';
import type { ExplorePlace } from '../../content/schema';
import { PLACE_CATEGORIES, PLACE_CATEGORY_LABELS, type PlaceCategory } from '../../content/taxonomies';
import { asset } from '../../lib/asset';
import { text } from '../../lib/i18n';
import { Eyebrow, LinkOut, SectionHeader, STRETCHED_LINK, Tabs } from '../ui';

/** Explore Austin: place cards filtered by category tabs. */
export function ExploreAustin({
  places,
  copy,
}: {
  places: ExplorePlace[];
  copy: { eyebrow: string; title: string; intro?: string };
}) {
  const [tab, setTab] = useState<'all' | PlaceCategory>('all');
  const shown = tab === 'all' ? places : places.filter((p) => p.categories.includes(tab));

  return (
    <section className="px-6 py-16 md:px-8 md:py-24">
      <div className="mx-auto flex max-w-content flex-col gap-6">
        <SectionHeader
          size="display"
          eyebrow={copy.eyebrow}
          title={copy.title}
          aside={copy.intro && <span className="block md:text-right">{copy.intro}</span>}
          className="border-b border-border-strong py-3"
        />
        <Tabs
          label="Place types"
          items={[
            { id: 'all', label: 'All' },
            ...PLACE_CATEGORIES.map((c) => ({ id: c, label: PLACE_CATEGORY_LABELS[c] })),
          ]}
          value={tab}
          onChange={(id) => setTab(id as 'all' | PlaceCategory)}
        >
          <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <li
                key={p.id}
                className="group relative flex flex-col gap-4 border border-border-strong p-[20px] transition-colors duration-hover hover:bg-surface-muted"
              >
                <div className="aspect-[4/3] w-full overflow-hidden md:aspect-square">
                  <img src={asset(p.image.src)} alt={p.image.alt} loading="lazy" className="size-full object-cover" />
                </div>
                <h3 className="m-0 text-nav font-normal text-ink">{text(p.name)}</h3>
                <Eyebrow>{p.categories.map((c) => PLACE_CATEGORY_LABELS[c]).join(' • ')}</Eyebrow>
                <p className="m-0 text-small">
                  <LinkOut
                    href={p.url}
                    provider={p.provider}
                    label="Learn more"
                    from="community"
                    className={STRETCHED_LINK}
                  />
                </p>
              </li>
            ))}
          </ul>
        </Tabs>
      </div>
    </section>
  );
}
