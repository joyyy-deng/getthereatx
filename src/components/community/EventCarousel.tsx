import { useState } from 'react';
import type { Occurrence } from '../../data';
import { asset } from '../../lib/asset';
import { nextText, recurrenceText } from '../../lib/eventText';
import { text } from '../../lib/i18n';
import { LinkOut, STRETCHED_LINK } from '../ui';

const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');

/** Upcoming events, one slide per event (its next date). Events without a photo are left out. */
export function EventCarousel({ events, empty }: { events: Occurrence[]; empty: string }) {
  const [index, setIndex] = useState(0);
  /** Images that failed to load; their events drop out too. */
  const [failed, setFailed] = useState<ReadonlySet<string>>(new Set());
  const shown = events.filter((o) => o.event.image && !failed.has(o.event.image.src));
  if (!shown.length) {
    return <p className="mx-auto max-w-content px-6 text-body text-ink-muted md:px-8">{empty}</p>;
  }
  // Stay in range if the current event just dropped out.
  const at = Math.min(index, shown.length - 1);
  const current = shown[at];
  const { event } = current;
  const photo = event.image!;
  const repeats = recurrenceText(event);
  const go = (step: number) => setIndex((i) => (Math.min(i, shown.length - 1) + step + shown.length) % shown.length);

  const chevron = (dir: 'prev' | 'next') => (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d={dir === 'prev' ? 'M12.5 4l-6 6 6 6' : 'M7.5 4l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="px-6 md:px-8 lg:px-0">
      {/* Below 1024px (Figma mobile): photo fills the block, white card over its top,
          prev / count / next at the bottom. Desktop: the full-bleed dark slide. */}
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="Upcoming events"
        className="relative mx-auto flex max-w-content flex-col overflow-hidden bg-ink lg:block lg:h-[484px] lg:max-w-none"
      >
        <div className="absolute inset-0 overflow-hidden">
          {/* Blurred fill behind, whole image in front, so posters aren't cropped. */}
          <img
            src={asset(photo.src)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-xl"
          />
          <img
            src={asset(photo.src)}
            alt={photo.alt}
            onError={() => setFailed((f) => new Set(f).add(photo.src))}
            className="absolute inset-0 size-full object-cover lg:left-[120px] lg:w-[45%] lg:object-contain lg:object-left"
          />
        </div>

        <div
          aria-live="polite"
          aria-atomic="true"
          className="relative m-4 mb-0 flex flex-col items-start gap-2 bg-bg p-4 text-left md:m-6 md:mb-0 md:gap-3 md:p-6 lg:absolute lg:bottom-[60px] lg:right-[120px] lg:m-0 lg:w-[560px] lg:items-end lg:p-[36px] lg:text-right"
        >
          <p className="sr-only">
            Event {at + 1} of {shown.length}
          </p>
          <h3 className="m-0 text-h4 font-normal text-ink lg:text-h1">{text(event.title)}</h3>
          {/* Phones show only the title and description; date and address from 768px. */}
          <p className="m-0 hidden font-mono text-data text-ink md:block">
            {repeats && (
              <>
                {repeats}
                <br />
                Next:{' '}
              </>
            )}
            {nextText(current.start, current.end)}
          </p>
          <p className="m-0 hidden text-small text-ink-muted md:block">
            {event.venue.address.startsWith(event.venue.name)
              ? event.venue.address
              : `${event.venue.name}, ${event.venue.address}`}
          </p>
          <p className="m-0 text-small text-ink-muted">{text(event.blurb)}</p>
          {event.url && (
            <p className="m-0 text-small">
              <LinkOut
                href={event.url}
                provider={host(event.url)}
                label="Learn more"
                from="community"
                className={STRETCHED_LINK}
              />
            </p>
          )}
        </div>

        {shown.length > 1 && (
          <>
            {/* Phones and tablets: controls on the photo, under the card. */}
            <div className="relative z-10 mt-[120px] flex items-center justify-end gap-2 p-3 md:mt-[200px] lg:hidden">
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Previous event"
                className="grid size-[40px] place-items-center rounded-pill bg-bg text-ink shadow-raised transition-colors duration-hover hover:bg-surface-muted"
              >
                {chevron('prev')}
              </button>
              <span aria-hidden="true" className="order-first mr-auto bg-bg px-2 py-1 font-mono text-data text-ink">
                {at + 1} / {shown.length}
              </span>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Next event"
                className="grid size-[40px] place-items-center rounded-pill bg-bg text-ink shadow-raised transition-colors duration-hover hover:bg-surface-muted"
              >
                {chevron('next')}
              </button>
            </div>
            {/* Desktop: large chevrons on the slide. */}
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous event"
              className="absolute left-[37px] top-1/2 hidden size-[58px] -translate-y-1/2 rounded-pill transition-colors duration-hover hover:bg-white/10 lg:block"
            >
              <img
                src={asset('/icons/chevron-right.svg')}
                alt=""
                width={58}
                height={58}
                className="block -scale-x-100"
              />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next event"
              className="absolute right-[15px] top-1/2 hidden size-[58px] -translate-y-1/2 rounded-pill transition-colors duration-hover hover:bg-white/10 lg:block"
            >
              <img src={asset('/icons/chevron-right.svg')} alt="" width={58} height={58} className="block" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
