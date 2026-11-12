import { useParams } from 'react-router-dom';
import { PageLoading } from '../components/ui';
import { getCategoryNames, getPageContent } from '../data';
import { sampleEvent, samplePost, sampleRelated } from '../dev/templateSamples';
import { expandEvent } from '../lib/recurrence';
import { useContent } from '../lib/useContent';
import { EventView } from './EventDetail';
import { GuideView } from './Guide';
import { NotFound } from './NotFound';

// /dev/templates/blog and /dev/templates/event: the two templates filled with
// Figma's placeholder text, for checking against the Figma frames and for the
// browser tests. Not linked from the site.

export function TemplatePreview() {
  const { kind } = useParams();
  const data = useContent(async () => {
    const [copy, categoryNames] = await Promise.all([getPageContent(), getCategoryNames()]);
    return { copy, categoryNames };
  });
  if (!data) return <PageLoading />;
  if (kind === 'blog') {
    return <GuideView copy={data.copy.guide} post={samplePost} related={sampleRelated} categoryNames={data.categoryNames} />;
  }
  if (kind === 'event') {
    const [occurrence] = expandEvent(sampleEvent);
    const more = [1, 2, 3].map((n) => ({ ...occurrence, event: { ...sampleEvent, id: `more-${n}`, slug: 'sample-event' } }));
    return <EventView copy={data.copy.event} occurrence={occurrence} more={more} />;
  }
  return <NotFound />;
}
