import type { HandoffLink, Place, Program, Resource } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { handoffUrl, type CardPlan } from '../../lib/trip';
import { Eyebrow, LinkOut } from '../ui';
import { asset } from '../../lib/asset';

export interface ModeCardProps {
  card: CardPlan;
  from: Place;
  to: Place;
  resources: Map<string, Resource>;
  /** Top card while chips are selected. */
  bestMatch: boolean;
  airport: boolean;
  ctxGo?: Program;
  /** Resource lines added by the selected chips (top card only). */
  extras?: { label: string; resource: Resource }[];
}

const mono = 'font-mono text-data text-ink-muted';

/** Figma Plan Your Trip mode card: mode, mascot, time range, then hand-offs to the right tool. */
export function ModeCard({ card, from, to, resources, bestMatch, airport, ctxGo, extras = [] }: ModeCardProps) {
  const { mode, minutes, longRide } = card;
  const trip = { from, to };

  function link(l: HandoffLink, as: 'button' | 'inline') {
    const r = resources.get(l.resourceId);
    if (!r) return null;
    return (
      <LinkOut
        key={l.resourceId + (l.travelmode ?? '')}
        as={as}
        size="md"
        className={as === 'button' ? 'w-full whitespace-normal text-center' : undefined}
        href={handoffUrl(r, trip, l.travelmode)}
        provider={r.provider}
        label={text(l.label)}
        resourceId={r.id}
        from="plan"
        mode={mode.id}
      />
    );
  }

  const title = <h3 className="m-0 text-body-lg font-medium text-ink">{text(mode.title)}</h3>;

  if (longRide) {
    return (
      <article className="flex flex-col gap-2 rounded-md border border-border bg-bg p-4">
        <div className="flex items-baseline justify-between gap-4">
          {title}
          <Eyebrow>Long ride</Eyebrow>
        </div>
        <p className="m-0 text-small text-ink-muted">
          {minutes[0]}–{minutes[1]} min by bike. Try bike + bus: ride to a stop and bring your bike on board.
        </p>
        {mode.longRide && <div className="text-small">{link(mode.longRide, 'inline')}</div>}
      </article>
    );
  }

  const primary = airport && mode.airportPrimary ? mode.airportPrimary : mode.primary;

  return (
    <article className="flex flex-col gap-3 rounded-md border border-border bg-bg p-4">
      <div className="flex gap-3">
        <div className="flex w-[104px] shrink-0 flex-col gap-2">
          {title}
          {mode.image && (
            <img src={asset(mode.image.src)} alt={mode.image.alt} className="h-[86px] w-[104px] object-contain" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Eyebrow className={cx(bestMatch && '!text-action')}>
            {bestMatch ? 'Best match for your preferences!' : text(mode.eyebrow)}
          </Eyebrow>
          <p className="tabular m-0 whitespace-nowrap text-data-lg text-ink">
            {minutes[0]}–{minutes[1]} min
          </p>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-small text-ink-muted">{text(mode.effort)}</p>
            <p className={cx('m-0', mono)}>Cost: {text(mode.cost)}</p>
          </div>
          {link(primary, 'button')}
          {mode.secondary.length > 0 && (
            <p className="m-0 flex flex-wrap gap-x-3 gap-y-1 text-small">
              {mode.secondary.map((l) => {
                const r = resources.get(l.resourceId);
                return (
                  <span key={l.resourceId + (l.travelmode ?? '')} className="inline-flex items-baseline gap-1">
                    {link(l, 'inline')}
                    {r?.bestOn === 'desktop' && <span className="text-ink-muted">(desktop)</span>}
                  </span>
                );
              })}
            </p>
          )}
          {mode.ctxGo && ctxGo?.url && (
            <p className="m-0 self-start rounded-pill bg-surface-muted px-3 py-1 text-small">
              <LinkOut
                href={ctxGo.url}
                provider={ctxGo.provider}
                label="Earn $5 for this trip with CTX GO"
                resourceId={ctxGo.id}
                from="plan"
                mode={mode.id}
              />
            </p>
          )}
        </div>
      </div>
      {extras.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 border-t border-border p-0 pt-3 text-small">
          {extras.map(({ label, resource: r }) => (
            <li key={r.id}>
              <span className="text-ink-muted">{label}: </span>
              <LinkOut href={r.url} provider={r.provider} label={r.action} resourceId={r.id} from="plan" />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
