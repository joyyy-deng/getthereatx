import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import pages from '../content/pages.json';
import posts from '../content/posts.json';
import type { Post } from '../content/schema';
import { samplePost, sampleRelated } from '../dev/templateSamples';
import { renderPage } from '../test/render';
import { GuideView } from './Guide';

const names = { 'biking-austin': 'Biking Austin' };
const view = (post: Post, related: Post[] = sampleRelated) =>
  renderPage(<GuideView copy={pages.guide} post={post} related={related} categoryNames={names} />);

describe('blog template', () => {
  it('shows the title as the only h1, the description and a dateless meta line', () => {
    view(samplePost);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Article title goes here');
    expect(screen.getByText(/one or two sentence summary/)).toBeInTheDocument();
    expect(screen.getByText(/min read/).textContent).toBe('1 min read  ·  By Get There ATX');
    expect(screen.queryByText(/Updated/)).toBeNull();
  });

  it('shows the date only when the post turns it on', () => {
    view({ ...samplePost, showDate: true });
    expect(screen.getByText(/Updated Oct 2026/)).toBeInTheDocument();
  });

  it('back link goes to the guides in Resources', () => {
    view(samplePost);
    expect(screen.getByRole('link', { name: 'Back to Resources' })).toHaveAttribute('href', '/resources#directory');
  });

  it('renders each block as the right element', () => {
    const { container } = view(samplePost);
    // Facts strip: a description list with three label/value pairs.
    expect(container.querySelectorAll('dl dt')).toHaveLength(3);
    expect(screen.getByText('75+ across Austin').tagName).toBe('DD');
    // Tip callout with its label.
    expect(screen.getByText('Tip')).toBeInTheDocument();
    // Steps: an ordered list, each title a heading that says its number to screen readers.
    const steps = container.querySelector('ol')!;
    expect(within(steps).getAllByRole('listitem')).toHaveLength(4);
    expect(within(steps).getByRole('heading', { name: 'Step 1: Find a station' })).toBeInTheDocument();
    // Table: real headers.
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('columnheader')).toHaveLength(3);
    expect(within(table).getAllByRole('rowheader')).toHaveLength(3);
    // Image caption.
    expect(screen.getByText('Caption describing the image').tagName).toBe('FIGCAPTION');
    // Button inside the site stays in the tab.
    expect(screen.getByRole('link', { name: 'Primary action' })).toHaveAttribute('href', '/plan');
  });

  it('Keep reading: three cards linking to their guides', () => {
    view(samplePost);
    const section = screen.getByRole('region', { name: 'Keep reading' });
    const links = within(section).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/guides/sample-related-1');
    expect(within(section).getAllByText('Biking Austin')).toHaveLength(3);
  });

  it('hides Keep reading when there are no related posts', () => {
    view(samplePost, []);
    expect(screen.queryByRole('region', { name: 'Keep reading' })).toBeNull();
  });

  it('ends with the Ready to plan your trip panel linking to Plan Your Trip', () => {
    view(samplePost);
    const cta = screen.getByRole('region', { name: 'Ready to plan your trip?' });
    expect(within(cta).getByRole('link', { name: /Plan my trip/ })).toHaveAttribute('href', '/plan');
  });

  it('a post with a video plays it in the hero', () => {
    view({ ...samplePost, video: { youtubeId: 'GdiiVwK9rZg' } });
    expect(screen.getByRole('button', { name: /Play video: Article title goes here/ })).toBeInTheDocument();
  });

  it('a post without body text links to the live post', () => {
    view({ ...samplePost, body: undefined });
    expect(screen.getByRole('link', { name: /Read the full post on getthereatx.com/ })).toHaveAttribute('href', samplePost.url);
  });

  it('the helmet post shows its five steps word for word', () => {
    const helmet = posts.find((p) => p.slug === '5-steps-of-a-helmet-fitting') as unknown as Post;
    view(helmet, []);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      'Step 1: Find the Front of Your Helmet',
      'Step 2: Position the Helmet Correctly',
      'Step 3: Tighten the Back',
      'Step 4: Check the Straps',
      'Step 5: Buckle Up',
    ]);
    expect(screen.getByText('Turn it clockwise to tighten.')).toBeInTheDocument();
  });
});
