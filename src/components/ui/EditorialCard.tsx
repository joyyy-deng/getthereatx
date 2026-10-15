import type { ReactNode } from 'react';
import type { Img } from '../../content/schema';
import { cx } from '../../lib/cx';
import { asset } from '../../lib/asset';

export interface EditorialCardProps {
  title: string;
  image: Img;
  body: string;
  /** The card's single action: a LinkIn or LinkOut with STRETCHED_LINK so the whole card clicks. */
  action: ReactNode;
  /** Figma draws a 1px border except where cards sit on a photo (Community). */
  bordered?: boolean;
  className?: string;
}

/** Square, 1px-bordered image card (Home / Community "Try something new"). */
export function EditorialCard({ title, image, body, action, bordered = true, className }: EditorialCardProps) {
  return (
    <article
      className={cx(
        'group relative flex h-full flex-col gap-2 rounded-none bg-bg p-[20px] transition-colors duration-hover hover:bg-surface-muted',
        bordered && 'border border-border-strong',
        className,
      )}
    >
      <h3 className="m-0 text-nav font-normal text-ink">{title}</h3>
      <div className="aspect-[284/185] w-full overflow-hidden">
        <img
          src={asset(image.src)}
          alt={image.alt}
          loading="lazy"
          className="size-full object-cover transition-transform duration-hover ease-out group-hover:scale-[1.02]"
        />
      </div>
      <p className="m-0 text-small text-ink-muted">{body}</p>
      <div className="mt-auto pt-2 text-small">{action}</div>
    </article>
  );
}
