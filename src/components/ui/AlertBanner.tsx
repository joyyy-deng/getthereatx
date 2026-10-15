import { useState } from 'react';
import type { Alert } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { LinkOut } from './LinkOut';

const SEVERITY: Record<Alert['severity'], { box: string; label: string }> = {
  info: { box: 'bg-alert-info-bg text-alert-info-ink border-transparent', label: 'Info' },
  advisory: { box: 'bg-alert-advisory-bg text-alert-advisory-ink border-alert-advisory-border', label: 'Advisory' },
  disruption: {
    box: 'bg-alert-disruption-bg text-alert-disruption-ink border-alert-disruption-border',
    label: 'Disruption',
  },
};

const storageKey = (id: string) => `gtatx:alert-dismissed:${id}`;

function wasDismissed(id: string): boolean {
  try {
    return sessionStorage.getItem(storageKey(id)) === '1';
  } catch {
    return false;
  }
}

/** Staff-posted alert. Dismissal lasts for the browser session, per alert id. */
export function AlertBanner({ alert }: { alert: Alert }) {
  const [dismissed, setDismissed] = useState(() => wasDismissed(alert.id));
  if (dismissed) return null;

  const s = SEVERITY[alert.severity];
  function dismiss() {
    try {
      sessionStorage.setItem(storageKey(alert.id), '1');
    } catch {
      // Storage blocked: dismissal lasts until reload.
    }
    setDismissed(true);
  }

  return (
    <div
      role={alert.severity === 'disruption' ? 'alert' : 'status'}
      className={cx('flex items-start gap-4 border-y px-4 py-3 text-small', s.box)}
    >
      <p className="m-0 flex-1">
        <span className="mr-2 font-mono text-eyebrow uppercase">{s.label}</span>
        {text(alert.message)}
        {alert.link && (
          <>
            {' '}
            <LinkOut
              href={alert.link.url}
              provider={new URL(alert.link.url).hostname.replace(/^www\./, '')}
              label={text(alert.link.label)}
              from="alert"
              className="!text-current"
            />
          </>
        )}
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss alert"
        className="-m-1 rounded-sm p-1 leading-none hover:opacity-70"
      >
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  );
}
