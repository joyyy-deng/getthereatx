import { useParams } from 'react-router-dom';
import { ArrowButton, BackLink, BodyBlock, Hero, RelatedCard } from '../components/article/parts';
import { VideoPlayer } from '../components/article/VideoPlayer';
import { PageLoading } from '../components/ui';
import { LinkOut } from '../components/ui/LinkOut';
import type { PageContent, Post } from '../content/schema';
import { getCategoryNames, getPageContent, getPost, getPosts } from '../data';
import { metaLine } from '../lib/articleMeta';
import { asset } from '../lib/asset';
import { text } from '../lib/i18n';
import { plainText } from '../lib/richText';
import { useContent } from '../lib/useContent';
import { NotFound } from './NotFound';

// Blog pages (/guides/:slug): Figma "Article/blog Master template" (desktop
// 980:1883, mobile 981:2335). One template for every post:
//   hero (photo, or the post's video) → back link → title, description, meta
//   → the post's blocks → Keep reading (same category) → Ready to plan your trip?
// In WordPress this is the Elementor Theme Builder "Single Post" template; the
// blocks are the post content (docs/cms-plan.md).

type Copy = PageContent['guide'];

/** The guide route: a fresh page per post, so clicking another guide loads it. */
export function GuideRoute() {
  const { slug = '' } = useParams();
  return <Guide key={slug} slug={slug} />;
}

function Guide({ slug }: { slug: string }) {
  const data = useContent(async () => {
    const [copy, post, posts, categoryNames] = await Promise.all([getPageContent(), getPost(slug), getPosts(), getCategoryNames()]);
    if (!post) return { missing: true as const };
    // "Keep reading": other posts that share a category, newest first.
    const related = posts
      .filter((p) => p.slug !== post.slug && p.categories.some((c) => post.categories.includes(c)))
      .sort((a, b) => (b.published ?? b.lastReviewed).localeCompare(a.published ?? a.lastReviewed))
      .slice(0, 3);
    return { missing: false as const, copy: copy.guide, post, related, categoryNames };
  });

  if (!data) return <PageLoading />;
  if (data.missing) return <NotFound />;
  return <GuideView {...data} />;
}

/** The template itself, for any post (also /dev/templates/blog with Figma's sample text). */
export function GuideView({
  copy,
  post,
  related,
  categoryNames,
}: {
  copy: Copy;
  post: Post;
  related: Post[];
  categoryNames: Record<string, string>;
}) {
  const title = text(post.title);

  // The summary is often the post's opening words cut off with "…"; when the
  // body starts the same way, the header skips it so the text isn't read twice.
  const summary = text(post.summary);
  const opening = post.body?.find((b) => b.type === 'paragraph');
  const showSummary = !(opening && plainText(opening.text).startsWith(summary.replace(/(\s*(…|\.\.\.)|[.:])$/, '').slice(0, 60)));

  return (
    <article>
      {post.video ? (
        <Hero>
          <VideoPlayer youtubeId={post.video.youtubeId} title={title} />
        </Hero>
      ) : (
        <Hero image={post.image} />
      )}

      <header className="flex flex-col px-article py-6 md:pb-14 md:pt-10">
        {/* Figma has no back link on the phone frame. */}
        <BackLink to="/resources?mode=Guides#directory" label={copy.backLabel} className="hidden md:flex" />
        <div className="flex flex-col gap-4 md:gap-5">
          {/* The removed eyebrow's line, kept so the spacing matches Figma. */}
          <div aria-hidden="true" className="h-[15px]" />
          <h1 className="m-0 text-a-title font-bold text-ink">{title}</h1>
          {showSummary && <p className="m-0 max-w-[760px] text-a-lead text-ink-soft">{summary}</p>}
          <p className="m-0 whitespace-pre-wrap text-a-meta text-ink-soft">{metaLine(post, copy)}</p>
        </div>
      </header>

      <div className="flex flex-col gap-6 px-article pb-8 md:gap-8 md:pb-16 md:pt-4">
        {post.body?.length ? (
          post.body.map((b, i) => <BodyBlock key={i} block={b} tipLabel={copy.tipLabel} />)
        ) : (
          <p className="m-0 text-a-body text-charcoal">
            <LinkOut href={post.url} provider="GetThereATX" label={copy.readFullPost} resourceId={`post:${post.id}`} from="guide" />
          </p>
        )}
      </div>

      {related.length > 0 && <KeepReading title={copy.relatedTitle} posts={related} categoryNames={categoryNames} />}

      <PlanTripPanel cta={copy.cta} />
    </article>
  );
}

/** Figma "Keep reading": three related cards; stacked on phones. */
function KeepReading({ title, posts, categoryNames }: { title: string; posts: Post[]; categoryNames: Record<string, string> }) {
  return (
    <section aria-labelledby="related-title" className="flex flex-col gap-6 border-t border-sky px-article py-10 md:gap-10 md:py-[80px]">
      <h2 id="related-title" className="m-0 text-a-section font-medium text-ink">
        {title}
      </h2>
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        {posts.map((p) => (
          <li key={p.id} className="min-w-0">
            <RelatedCard to={`/guides/${p.slug}`} image={p.image} eyebrow={categoryNames[p.categories[0]]} title={text(p.title)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Figma "Ready to plan your trip?" panel. Text is navy, not Figma's white:
 * white on #63ac56 is 2.8:1, below the WCAG minimum even for large text.
 */
function PlanTripPanel({ cta }: { cta: Copy['cta'] }) {
  return (
    <div className="px-article pb-10 md:pb-[80px]">
      <section aria-labelledby="plan-cta-title" className="flex flex-col gap-6 bg-leaf-deep px-6 py-8 lg:flex-row lg:items-center lg:gap-12 lg:p-14">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <h2 id="plan-cta-title" className="m-0 text-a-cta font-bold text-navy">
            {cta.title}
          </h2>
          <p className="m-0 text-a-cta-text text-navy">{cta.text}</p>
          <ArrowButton href={cta.to} label={cta.button} tone="black" className="w-full justify-between md:w-auto md:justify-start" />
        </div>
        <div className="flex h-[160px] w-full shrink-0 items-center justify-center bg-sky p-4 lg:h-[240px] lg:w-[320px]">
          <img src={asset('/images/mascots/guides-kangaroo.svg')} alt="" className="block max-h-full max-w-full" />
        </div>
      </section>
    </div>
  );
}
