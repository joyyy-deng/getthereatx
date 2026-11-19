import { Children, type MouseEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PostBlock } from '../../content/schema';
import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';
import { track } from '../../lib/track';
import { RichText } from '../guide/RichText';
import { Arrow } from '../ui/Arrow';
import { PageLink } from '../ui/PageLink';

// Pieces shared by the blog template (Figma "Article/blog Master template",
// 980:1883 / 981:2335) and the event template ("Community Event Detail
// Template", 1014:2549 / 1015:277). Each one maps to one Elementor block in
// wordpress/elementor (see docs/cms-plan.md), so the names match Figma's layers.

/** Figma's 16px arrow (Frame 979:2010), in the text color (so it's white on dark buttons),
 *  with the hover exit-and-return. */
export function ArrowIcon() {
  return <Arrow className="size-4" />;
}

/** Figma 1008:2355: the angled arrow, mirrored to point back, then the label. */
/**
 * "Back": returns to the page the reader came from on this site (Home,
 * Resources, Community…); `to` is used when they arrived from outside.
 */
export function BackLink({ to, label, className }: { to: string; label: string; className?: string }) {
  const navigate = useNavigate();
  const goBack = (e: MouseEvent<HTMLAnchorElement>) => {
    // React Router counts in-app pages in history.state.idx; 0 means this was the first page.
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      navigate(-1);
    }
  };
  return (
    <PageLink to={to} onClick={goBack} className={cx('flex items-center gap-[15px] self-start text-a-back font-semibold text-ink', className)}>
      {/* Figma: the angled arrow, mirrored to point back (Joy's Semibold arrow). */}
      <span aria-hidden="true" className="block shrink-0 -scale-x-100">
        <Arrow still className="size-4" />
      </span>
      <span className="u-draw">{label}</span>
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
        <img loading="lazy" decoding="async" src={asset(src)} alt={alt} className="block h-auto max-h-[400px] w-auto max-w-full object-contain" />
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
// Hover: the green slant wash (index.css .btn-slant); dark text.
// Joy 2026-11-19: every button starts white, with a dark outline on white sections. `black` is the
// "Ready to plan your trip?" panel's button: plain white on the green panel, no outline and no slant.
const buttonTone: Record<ButtonTone, string> = {
  green: 'btn-slant border-2 border-ink bg-white text-ink',
  outline: 'btn-slant border-2 border-ink bg-white text-ink',
  black: 'bg-white text-ink',
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
    'flex items-center px-5 py-4 text-a-button font-bold',
    stretch ? 'w-full justify-between' : 'gap-8 self-start',
    buttonTone[tone],
    className,
  );
  const inner = (
    <>
      {label}
      <ArrowIcon />
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
      <ArrowIcon />
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
          <img loading="lazy" decoding="async" src={asset(image.src)} alt="" className="block size-full object-cover transition-transform duration-hover group-hover:scale-[1.02]" />
        )}
      </span>
      <span className="flex flex-1 flex-col gap-[10px] p-6">
        {eyebrow && <span className="text-a-eyebrow uppercase text-ink-soft">{eyebrow}</span>}
        <span className="u-draw text-a-card font-medium text-ink">{title}</span>
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
