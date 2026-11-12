import { Children, type ReactNode } from 'react';
import type { PostBlock } from '../../content/schema';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { track } from '../../lib/track';
import { RichText } from '../guide/RichText';
import { PageLink } from '../ui/PageLink';

// Pieces shared by the blog template (Figma "Article/blog Master template",
// 980:1883 / 981:2335) and the event template ("Community Event Detail
// Template", 1014:2549 / 1015:277). Each one maps to one Elementor block in
// wordpress/elementor (see docs/cms-plan.md), so the names match Figma's layers.

/** Figma's 16px arrow (Frame 979:2010). `light` is the white version for dark buttons. */
export function ArrowIcon({ light = false }: { light?: boolean }) {
  return (
    <img
      src={asset(light ? '/images/icons/arrow-up-right-white.svg' : '/images/icons/arrow-up-right.svg')}
      alt=""
      width={16}
      height={16}
      className="block size-4 shrink-0"
    />
  );
}

/** Figma 1008:2355: the angled arrow, mirrored to point back, then the label. */
export function BackLink({ to, label, className }: { to: string; label: string; className?: string }) {
  return (
    <PageLink to={to} className={cx('flex items-center gap-[15px] self-start text-a-back font-semibold text-ink hover:underline', className)}>
      {/* The 18×16 frame; the drawing overflows it a little, as in Figma. */}
      <span aria-hidden="true" className="relative block h-4 w-[18px] shrink-0 -scale-x-100">
        <img
          src={asset('/images/icons/arrow-back.svg')}
          alt=""
          width={20.1642}
          height={19.1642}
          className="absolute bottom-[-13.53%] left-[-12.02%] right-0 top-[-6.25%] block"
        />
      </span>
      {label}
    </PageLink>
  );
}

/**
 * Figma "Article/Hero image": the photo (or `children`, e.g. a video) across
 * the page, 200px phone / 360px desktop (tokens.css --a-hero). The photo fills
 * the band by cropping (object-cover), never by stretching.
 */
export function Hero({ image, children }: { image?: { src: string; alt: string }; children?: ReactNode }) {
  if (!image && !children) return null;
  return (
    <div className="flex h-[var(--a-hero)] w-full items-center justify-center overflow-hidden bg-sky">
      {children ?? <img src={asset(image!.src)} alt={image!.alt} className="block size-full object-cover" />}
    </div>
  );
}

/** Figma "Article/Fact": an 11px caps label over a 22px bold value. */
export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-a-label uppercase text-ink-soft">{label}</dt>
      <dd className="m-0 break-words text-a-fact font-bold text-ink">{children}</dd>
    </div>
  );
}

/**
 * Figma facts strip (995:2317 / "Travel options"): mist panel, facts in a row
 * on desktop, stacked on phones. `tight` = the event's 20px phone padding.
 */
export function FactPanel({ children, tight = false }: { children: ReactNode; tight?: boolean }) {
  // Any number of facts: up to three share a row equally, more start a new row.
  const columns = ['md:grid-cols-1', 'md:grid-cols-2', 'md:grid-cols-3'][Math.min(Children.count(children), 3) - 1] ?? 'md:grid-cols-3';
  return (
    <dl className={cx('m-0 flex w-full flex-col gap-4 bg-mist md:grid md:gap-6 md:p-6', columns, tight ? 'p-5' : 'p-6')}>
      {children}
    </dl>
  );
}

/** Figma "Article/Tip callout": mist box, 4px navy bar, a caps label and the tip. */
export function TipCallout({ label, text }: { label: string; text: string }) {
  return (
    <div className="flex w-full bg-mist">
      <div aria-hidden="true" className="w-1 shrink-0 self-stretch bg-navy" />
      <div className="flex min-w-0 flex-1 flex-col gap-[6px] px-6 py-5">
        <p className="m-0 text-a-eyebrow uppercase text-ink-soft">{label}</p>
        <p className="m-0 text-a-copy text-ink">
          <RichText text={text} />
        </p>
      </div>
    </div>
  );
}

/** Figma "Article/Step": a navy numbered square, a title and its text. */
export function StepList({ items }: { items: { title: string; text: string[] }[] }) {
  return (
    <ol className="m-0 flex w-full list-none flex-col gap-6 p-0">
      {items.map((step, i) => (
        <li key={i} className="flex gap-5">
          <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center bg-navy text-[18px] font-bold text-white">
            {i + 1}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
            <h3 className="m-0 text-a-step font-bold text-ink">
              <span className="sr-only">Step {i + 1}:</span> {step.title}
            </h3>
            {step.text.map((t, j) => (
              <p key={j} className="m-0 text-a-copy text-ink-soft">
                <RichText text={t} />
              </p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Figma "Article/Image": the picture full width, a 13px caption under it. */
export function ArticleFigure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
  return (
    <figure className="m-0 flex w-full flex-col gap-3">
      {/* Figma's media box, up to 400px tall. The whole picture shows, never cropped (posts use posters and
          maps), never stretched and never enlarged past its own size. */}
      <div className="flex w-full justify-center bg-sky">
        <img src={asset(src)} alt={alt} className="block h-auto max-h-[400px] w-auto max-w-full object-contain" />
      </div>
      {caption && <figcaption className="text-a-caption text-ink-soft">{caption}</figcaption>}
    </figure>
  );
}

/** Figma "Article/Table": caps header over a 2px rule, rows over 1px sky rules, first column bold. */
export function ArticleTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  const cell = 'px-2 align-top first:pl-4 last:pr-4 break-words';
  return (
    <table className="w-full table-fixed border-collapse">
      <thead>
        <tr className="border-b-2 border-ink">
          {columns.map((c, i) => (
            <th key={i} scope="col" className={cx(cell, 'py-3 text-left text-a-eyebrow font-normal uppercase text-ink-soft')}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-b border-sky">
            {r.map((c, j) =>
              j === 0 ? (
                <th key={j} scope="row" className={cx(cell, 'py-4 text-left text-a-cell font-bold text-ink')}>
                  <RichText text={c} />
                </th>
              ) : (
                <td key={j} className={cx(cell, 'py-4 text-a-cell text-ink-soft')}>
                  <RichText text={c} />
                </td>
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

type ButtonTone = 'green' | 'outline' | 'black';
const buttonTone: Record<ButtonTone, string> = {
  green: 'bg-leaf text-ink',
  outline: 'border-2 border-ink bg-white text-ink',
  black: 'bg-ink text-white',
};

/**
 * Figma "Article/Button primary" and the event card's buttons: 16px bold
 * label and the arrow. Internal links stay in the tab; outside links open a
 * new tab and are logged as a hand-off. `stretch` = full width, label left,
 * arrow right (phones, the event card).
 */
export function ArrowButton({
  href,
  label,
  tone = 'green',
  stretch = false,
  className,
  from = 'guide',
  download,
  onClick,
}: {
  href: string;
  label: string;
  tone?: ButtonTone;
  stretch?: boolean;
  className?: string;
  from?: string;
  download?: string;
  onClick?: () => void;
}) {
  const classes = cx(
    'flex items-center px-5 py-4 text-a-button font-bold transition-opacity duration-hover hover:opacity-90',
    stretch ? 'w-full justify-between' : 'gap-8 self-start',
    buttonTone[tone],
    className,
  );
  const inner = (
    <>
      {label}
      <ArrowIcon light={tone === 'black'} />
    </>
  );
  if (download) {
    return (
      <a href={href} download={download} className={classes} onClick={onClick}>
        {inner}
      </a>
    );
  }
  if (href.startsWith('/')) {
    return (
      <PageLink to={href} className={classes}>
        {inner}
      </PageLink>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      onClick={() => {
        track('handoff', { from, href });
        onClick?.();
      }}
    >
      {label}
      <span className="sr-only"> (opens in a new tab)</span>
      <ArrowIcon light={tone === 'black'} />
    </a>
  );
}

/** Figma "Article/Related card": image, caps eyebrow, title, and the arrow (with `action` text on event cards). */
export function RelatedCard({
  to,
  image,
  eyebrow,
  title,
  action,
  imageClass = 'h-[128px] md:h-[160px]',
}: {
  to: string;
  image?: { src: string; alt: string };
  eyebrow?: string;
  title: string;
  action?: string;
  imageClass?: string;
}) {
  return (
    <PageLink to={to} className="group flex h-full min-w-0 flex-col bg-mist">
      <span className={cx('block w-full overflow-hidden bg-sky', imageClass)}>
        {image && (
          <img src={asset(image.src)} alt="" className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]" />
        )}
      </span>
      <span className="flex flex-1 flex-col gap-[10px] p-6">
        {eyebrow && <span className="text-a-eyebrow uppercase text-ink-soft">{eyebrow}</span>}
        <span className="text-a-card font-medium text-ink group-hover:underline">{title}</span>
        <span className="mt-auto flex items-center justify-end gap-2 text-a-back font-semibold text-ink">
          {action}
          <ArrowIcon />
        </span>
      </span>
    </PageLink>
  );
}

/** One post body block (schema PostBlock) in the blog template's styles. */
export function BodyBlock({ block, tipLabel }: { block: PostBlock; tipLabel: string }) {
  switch (block.type) {
    case 'heading':
      // Figma: 24px extra space above each section heading on desktop, 8px on phones.
      return (
        <h2 className="m-0 w-full pt-2 text-a-h2 font-bold text-ink md:pt-6">
          <RichText text={block.text} />
        </h2>
      );
    case 'paragraph':
      return (
        <p className="m-0 w-full text-a-body text-charcoal">
          <RichText text={block.text} />
        </p>
      );
    case 'list': {
      const List = block.ordered ? 'ol' : 'ul';
      return (
        <List className={cx('m-0 flex w-full flex-col gap-2 pl-6 text-a-body text-charcoal', block.ordered ? 'list-decimal' : 'list-disc')}>
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <RichText text={item} />
            </li>
          ))}
        </List>
      );
    }
    case 'image':
      return <ArticleFigure src={block.src} alt={block.alt} caption={block.caption} />;
    case 'tip':
      return <TipCallout label={block.label ?? tipLabel} text={block.text} />;
    case 'steps':
      return <StepList items={block.items} />;
    case 'facts':
      return (
        <FactPanel>
          {block.items.map((f, i) => (
            <Fact key={i} label={f.label}>
              {f.value}
            </Fact>
          ))}
        </FactPanel>
      );
    case 'table':
      return <ArticleTable columns={block.columns} rows={block.rows} />;
    case 'button':
      // Figma: 8px extra space above; full width on phones.
      return (
        <div className="flex w-full pt-2">
          <ArrowButton href={block.href} label={block.label} className="w-full justify-between md:w-auto md:justify-start" />
        </div>
      );
  }
}
