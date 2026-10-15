import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Chip, Eyebrow, PostRow, ResourceList, ResourceRow, SectionHeader } from '../components/ui';
import type { Persona, Post, Resource, ResourceModeCard } from '../content/schema';
import {
  AUDIENCE_FILTERS,
  AUDIENCE_LABELS,
  MODES,
  NEED_LABELS,
  NEEDS,
  type Audience,
  type Mode,
  type Need,
} from '../content/taxonomies';
import { getPosts, getResources, getResourcesPage } from '../data';
import { cx } from '../lib/cx';
import { text } from '../lib/i18n';
import { asset } from '../lib/asset';

// Resources (Figma 350:1440). This page is the registry: every resource and
// GetThereATX post in one directory, filtered in place. Filters live in the URL:
// /resources?mode=bus&who=student&need=learn-how&q=fares

const SMALL_CHIP = '!min-h-[34px] !px-3 !py-1 !text-small';

interface Data {
  resources: Resource[];
  posts: Post[];
  modes: ResourceModeCard[];
  personas: Persona[];
}

function oneOf<T extends string>(list: readonly T[], value: string | null): T | undefined {
  return list.find((v) => v === value);
}

export function Resources() {
  const [data, setData] = useState<Data>();
  const [params, setParams] = useSearchParams();
  const directoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([getResources(), getPosts(), getResourcesPage()]).then(([resources, posts, page]) =>
      setData({ resources, posts, ...page }),
    );
  }, []);

  const mode = oneOf<Mode>(MODES, params.get('mode'));
  const who = oneOf<Audience>(AUDIENCE_FILTERS, params.get('who'));
  const need = oneOf<Need>(NEEDS, params.get('need'));
  const q = params.get('q') ?? '';

  function setFilter(next: { mode?: Mode | null; who?: Audience | null; need?: Need | null; q?: string }) {
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(next)) {
          if (value) p.set(key, value);
          else p.delete(key);
        }
        return p;
      },
      { replace: true, preventScrollReset: true },
    );
  }

  function showDirectory() {
    directoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const { resources, posts } = useMemo(() => {
    if (!data) return { resources: [], posts: [] };
    const query = q.trim().toLowerCase();
    const hit = (...fields: string[]) => !query || fields.some((f) => f.toLowerCase().includes(query));
    return {
      resources: data.resources.filter(
        (r) =>
          (!mode || r.modes.includes(mode)) &&
          (!who || r.audiences.includes(who)) &&
          (!need || r.needs.includes(need)) &&
          hit(r.title, r.provider, r.action, r.oneLiner),
      ),
      posts: data.posts.filter(
        (p) =>
          (!mode || p.modes.includes(mode)) &&
          (!who || p.audiences.includes(who)) &&
          (!need || p.needs.includes(need)) &&
          hit(text(p.title), text(p.summary)),
      ),
    };
  }, [data, mode, who, need, q]);

  if (!data) return <div className="min-h-screen" aria-busy="true" />;

  const count = resources.length + posts.length;
  const modeCard = data.modes.find((m) => m.mode === mode);
  const filtered = !!(mode || who || need || q);

  return (
    <div className="px-8">
      {/* How-to's: mode cards filter the directory below. */}
      <section className="mx-auto flex max-w-content flex-col gap-12 pt-24">
        <SectionHeader level={1} size="display" eyebrow="How-to’s" title="Transportation resources" />
        <div className="grid grid-cols-4 gap-4">
          {data.modes.map((m) => {
            const selected = m.mode === mode;
            return (
              <button
                key={m.mode}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setFilter({ mode: selected ? null : m.mode });
                  if (!selected) showDirectory();
                }}
                className={cx(
                  'group flex min-h-[389px] flex-col items-start justify-between gap-4 rounded-none border bg-bg p-[20px] text-left transition-colors duration-hover',
                  selected ? 'border-2 border-ink' : 'border-border-strong hover:bg-surface-muted',
                )}
              >
                <span className="text-nav text-ink">{text(m.title)}</span>
                {m.image ? (
                  <img src={asset(m.image.src)} alt={m.image.alt} className="h-[234px] w-full object-contain" />
                ) : (
                  <span aria-hidden="true" className="h-[234px] w-full" />
                )}
                <span className="text-small text-link underline underline-offset-4">
                  {selected ? 'Showing below ↓' : 'Learn more →'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto flex max-w-content flex-col gap-12 py-24">
        <SectionHeader size="display" eyebrow="Blogs" title="Which sounds most like you?" />
        <div className="grid grid-cols-4 border-b border-border-strong">
          {data.personas.map((p, i) => {
            const cls = cx(
              'flex min-h-[330px] flex-col justify-between border-t border-white bg-ink p-[28px] text-left text-white transition-opacity duration-hover hover:opacity-90',
              'border-l',
              i === data.personas.length - 1 && 'border-r',
            );
            const body = (
              <>
                <span className="flex flex-col gap-4 pt-12">
                  <span className="text-h3 font-normal">{text(p.title)}</span>
                  <span className="text-small">{text(p.body)}</span>
                </span>
                <span className="text-small">View options →</span>
              </>
            );
            if (p.to) {
              return (
                <Link key={p.id} to={p.to} className={cls}>
                  {body}
                </Link>
              );
            }
            const active =
              (p.filter?.audience && p.filter.audience === who) || (p.filter?.need && p.filter.need === need);
            return (
              <button
                key={p.id}
                type="button"
                aria-pressed={!!active}
                onClick={() => {
                  setFilter({ who: p.filter?.audience ?? null, need: p.filter?.need ?? null });
                  showDirectory();
                }}
                className={cx(cls, active && 'outline outline-4 -outline-offset-8 outline-white')}
              >
                {body}
              </button>
            );
          })}
        </div>

        {/* Directory */}
        <div ref={directoryRef} className="flex scroll-mt-[140px] flex-col gap-4">
          <div className="flex items-end justify-between gap-6">
            <div className="flex flex-col gap-3">
              <div role="group" aria-label="Who is this for?" className="flex flex-wrap gap-2">
                <Chip label="All" selected={!who} onClick={() => setFilter({ who: null })} className={SMALL_CHIP} />
                {AUDIENCE_FILTERS.map((a) => (
                  <Chip
                    key={a}
                    label={AUDIENCE_LABELS[a]}
                    selected={who === a}
                    onClick={() => setFilter({ who: who === a ? null : a })}
                    className={SMALL_CHIP}
                  />
                ))}
              </div>
              <div role="group" aria-label="What do you need?" className="flex flex-wrap gap-2">
                {NEEDS.map((n) => (
                  <Chip
                    key={n}
                    label={NEED_LABELS[n]}
                    selected={need === n}
                    onClick={() => setFilter({ need: need === n ? null : n })}
                    className={SMALL_CHIP}
                  />
                ))}
              </div>
            </div>
            <label className="flex shrink-0 flex-col gap-2">
              <Eyebrow>Search this directory</Eyebrow>
              <input
                type="search"
                value={q}
                onChange={(e) => setFilter({ q: e.target.value })}
                placeholder="Search resources"
                className="h-[34px] w-[174px] rounded-sm border border-border-strong bg-bg px-3 text-small text-ink"
              />
            </label>
          </div>
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 text-small text-ink-muted" aria-live="polite">
            <span>
              Showing {count} {count === 1 ? 'resource' : 'resources'}
              {modeCard && ` for ${text(modeCard.title)}`}
            </span>
            {filtered && (
              <button
                type="button"
                onClick={() => setFilter({ mode: null, who: null, need: null, q: '' })}
                className="text-link underline underline-offset-4"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>

        {count > 0 ? (
          <ResourceList>
            {resources.map((r) => (
              <ResourceRow key={r.id} resource={r} variant="directory" from="resources" />
            ))}
            {posts.map((p) => (
              <PostRow key={p.id} post={p} from="resources" />
            ))}
          </ResourceList>
        ) : (
          <p className="m-0 border-y border-border-strong py-12 text-body text-ink-muted">
            Nothing matches those filters.{' '}
            <button
              type="button"
              onClick={() => setFilter({ mode: null, who: null, need: null, q: '' })}
              className="text-link underline underline-offset-4"
            >
              Clear filters
            </button>
          </p>
        )}
      </section>
    </div>
  );
}
