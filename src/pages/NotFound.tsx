import { LinkIn, PageLoading } from '../components/ui';
import { getPageContent } from '../data';
import { useContent } from '../lib/useContent';

/** Any URL the site doesn't know. Wording from content/pages.json ("notFound"). */
export function NotFound() {
  const copy = useContent(async () => (await getPageContent()).notFound);
  if (!copy) return <PageLoading />;
  return (
    <section className="mx-auto flex max-w-content flex-col gap-6 px-6 py-16 md:px-8 md:py-24">
      <h1 className="m-0 text-h1">{copy.title}</h1>
      <p className="m-0 text-body-lg text-ink-muted">{copy.intro}</p>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <LinkIn to="/plan" label="Plan your trip" />
        <LinkIn to="/resources" label="Browse resources" />
      </div>
    </section>
  );
}
