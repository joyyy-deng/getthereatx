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
        <BackLink to="/resources#directory" label={copy.backLabel} className="hidden md:flex" />
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
 * Figma "Ready to plan your trip?" panel, on the brand leaf green (#74ab60; Joy 2026-11-19, was
 * #63ac56). Text is navy, not Figma's white: white on the green fails WCAG contrast.
 * The axolotl (Home's Explore mascot) scoots in on hover. No sky box behind it, and no slant on
 * the button (Joy 2026-11-19).
 */
function PlanTripPanel({ cta }: { cta: Copy['cta'] }) {
  return (
    <div className="px-article pb-10 md:pb-[80px]">
      <section
        aria-labelledby="plan-cta-title"
        className="scoot-host flex flex-col overflow-hidden bg-leaf px-6 pt-8 lg:flex-row lg:items-stretch lg:gap-12 lg:px-14 lg:pt-14"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-5 pb-2 lg:self-center lg:pb-14">
          <h2 id="plan-cta-title" className="m-0 text-a-cta font-bold text-navy">
            {cta.title}
          </h2>
          <p className="m-0 text-a-cta-text text-navy">{cta.text}</p>
          <ArrowButton href={cta.to} label={cta.button} tone="black" className="w-full justify-between md:w-auto md:justify-start" />
        </div>
        {/* The axolotl faces left and scoots left with a little wheelie when the panel is hovered
            (Motion Lab "Scoot forward"; index.css .scoot--left, .scoot-lift). */}
        <div aria-hidden="true" className="flex h-[150px] w-full shrink-0 items-end justify-end lg:h-auto lg:w-[360px]">
          <span className="scoot--left relative mb-6 block h-[110px] w-[140px] lg:mb-14 lg:h-[190px] lg:w-[240px]">
            <span className="scoot-mascot relative block size-full">
              <span className="scoot-lines text-navy">
                <i />
                <i />
                <i />
              </span>
              <span className="scoot-lift block size-full">
                <img loading="lazy" decoding="async" src={asset('/images/mascots/austin-dog.svg')} alt="" className="block size-full -scale-x-100" />
              </span>
            </span>
          </span>
        </div>
      </section>
    </div>
  );
}
