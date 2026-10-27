import type { ReactNode } from 'react';
import { cx } from '../../lib/cx';
import { Eyebrow } from './Eyebrow';

export interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  /** Optional intro shown to the right of the title on wide screens (Home "Connect"). */
  aside?: ReactNode;
  /** h1 for page titles, h2 for section titles. */
  level?: 1 | 2;
  /** `display` matches the large Figma section titles ("Build confidence before you go"). */
  size?: 'display' | 'default';
  /** `light` for titles set on a photo (Community "Get There Together"). */
  tone?: 'dark' | 'light';
  id?: string;
  className?: string;
}

export function SectionHeader({
  eyebrow,
  title,
  aside,
  level = 2,
  size = 'default',
  tone = 'dark',
  id,
  className,
}: SectionHeaderProps) {
  const light = tone === 'light';
  const Heading = level === 1 ? 'h1' : 'h2';
  return (
    <div
      className={cx(
        'grid items-end gap-6',
        // Only split into two columns when there is side text to show.
        !!aside && 'md:grid-cols-[minmax(0,1fr)_minmax(0,364px)] md:gap-16',
        className,
      )}
    >
      <div className="flex flex-col gap-3">
        {eyebrow && <Eyebrow className={cx(light && '!text-white')}>{eyebrow}</Eyebrow>}
        <Heading
          id={id}
          className={cx(
            'm-0',
            light ? 'text-white' : 'text-ink',
            // Display titles step down to H1 size on phones (Figma mobile frames).
            size === 'display' ? 'text-h1 md:text-display' : level === 1 ? 'text-h1' : 'text-h2',
          )}
        >
          {title}
        </Heading>
      </div>
      {aside && <div className={cx('text-body', light ? 'text-white' : 'text-ink-muted')}>{aside}</div>}
    </div>
  );
}
