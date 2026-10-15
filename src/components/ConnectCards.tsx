import type { ConnectCard, Resource } from '../content/schema';
import { text } from '../lib/i18n';
import { EditorialCard, LinkOut, STRETCHED_LINK } from './ui';

/** Students / Families / Senior Citizens cards, shared with Community. */
export function ConnectCards({
  cards,
  resources,
  from,
  bordered = true,
}: {
  cards: ConnectCard[];
  resources: Map<string, Resource>;
  from: string;
  bordered?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((c) => {
        const r = resources.get(c.resourceId);
        return (
          <EditorialCard
            key={c.id}
            title={text(c.title)}
            image={c.image}
            body={text(c.body)}
            bordered={bordered}
            action={
              r && (
                <LinkOut
                  href={r.url}
                  provider={r.provider}
                  label={r.action}
                  resourceId={r.id}
                  from={from}
                  className={STRETCHED_LINK}
                />
              )
            }
          />
        );
      })}
    </div>
  );
}
