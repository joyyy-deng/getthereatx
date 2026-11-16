import { Fragment, type ReactNode } from 'react';
import { RICH_TOKEN } from '../../lib/richText';
import { track } from '../../lib/track';
import { PageLink } from '../ui/PageLink';

const linkClass = 'text-link underline decoration-1 underline-offset-[3px] hover:decoration-2';

/** Post text ([label](url) links and **bold**) as elements. */
export function RichText({ text, from = 'guide' }: { text: string; from?: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(RICH_TOKEN)) {
    if (m.index! > last) out.push(text.slice(last, m.index));
    const [, label, href, bold] = m;
    if (bold) {
      out.push(<strong key={m.index} className="font-semibold">{bold}</strong>);
    } else if (href.startsWith('/') || href.startsWith('#')) {
      out.push(
        <PageLink key={m.index} to={href} className={linkClass}>
          {label}
        </PageLink>,
      );
    } else if (!/^(https?:\/\/|mailto:|tel:)/i.test(href)) {
      // Anything that is not a web, email or phone link stays plain text.
      out.push(label);
    } else {
      out.push(
        <a
          key={m.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('handoff', { from, href })}
          className={linkClass}
        >
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>,
      );
    }
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

