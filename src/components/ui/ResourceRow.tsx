import type { ReactNode } from 'react';
import type { Post, Resource } from '../../content/schema';
import { cx } from '../../lib/cx';
import { text } from '../../lib/i18n';
import { Eyebrow } from './Eyebrow';
import { LinkOut } from './LinkOut';

const checkedFormat = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** Figma Student resources / Resources directory row: text on the left, a pill button on the right. */
function DirectoryRow({
  eyebrow,
  title,
  body,
  meta,
  action,
  clampBody,
}: {
  eyebrow?: string;
  title: string;
  body: string;
  meta?: ReactNode;
  action: ReactNode;
  clampBody?: boolean;
}) {
  return (
    <li className="grid min-h-[130px] grid-cols-[minmax(0,1fr)_auto] items-center gap-6 border-t border-border-strong py-6 transition-colors duration-hover ease-out hover:bg-surface-muted">
      <div className="flex flex-col gap-2">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h3 className="m-0 text-h4 font-normal text-ink">{title}</h3>
        <p className={cx('m-0 text-body text-ink-muted', clampBody && 'line-clamp-2')}>{body}</p>
        {meta}
      </div>
      {action}
    </li>
  );
}

export interface ResourceRowProps {
  resource: Resource;
  /**
   * `student`: matches the Figma Student resources rows (title, one-liner, button).
   * `directory`: adds the provider eyebrow, "Best on desktop" tag and link-checked date.
   */
  variant?: 'student' | 'directory';
  /** Screen name for hand-off tracking. */
  from?: string;
}

/** Divider row in the Student resources style. Wrap rows in <ResourceList>. */
export function ResourceRow({ resource: r, variant = 'student', from }: ResourceRowProps) {
  const directory = variant === 'directory';
  return (
    <DirectoryRow
      eyebrow={directory ? r.provider : undefined}
      title={r.title}
      body={r.oneLiner}
      meta={
        directory && (
          <p className="m-0 flex flex-wrap items-center gap-3 text-small text-ink-muted">
            {r.bestOn === 'desktop' && (
              <span className="rounded-pill border border-border px-2 py-0.5 text-ink">Best on desktop</span>
            )}
            <span>Link checked {checkedFormat.format(new Date(r.lastChecked))}</span>
          </p>
        )
      }
      action={
        <LinkOut
          as="button"
          variant="secondary"
          size="sm"
          shape="pill"
          href={r.url}
          provider={r.provider}
          label={r.action}
          resourceId={r.id}
          from={from}
        />
      }
    />
  );
}

/** A GetThereATX blog post in the Resources directory. "Read" opens the live post. */
export function PostRow({ post, from }: { post: Post; from?: string }) {
  return (
    <DirectoryRow
      eyebrow="GetThereATX"
      title={text(post.title)}
      body={text(post.summary)}
      clampBody
      action={
        <LinkOut
          as="button"
          variant="secondary"
          size="sm"
          shape="pill"
          href={post.url}
          provider="GetThereATX"
          label="Read"
          resourceId={`post:${post.id}`}
          from={from}
        />
      }
    />
  );
}

export function ResourceList({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx('m-0 list-none border-b border-border-strong p-0', className)}>{children}</ul>;
}
