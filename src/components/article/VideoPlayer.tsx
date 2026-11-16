import { useState } from 'react';

/**
 * Click-to-play video for the blog hero: the thumbnail and a play button until
 * someone presses play, then the YouTube player (youtube-nocookie, so no
 * YouTube cookies before that). Fills the hero's height at 16:9.
 */
export function VideoPlayer({ youtubeId, title }: { youtubeId: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video h-full max-w-full overflow-hidden bg-charcoal">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?rel=0&autoplay=1`}
          title={`Video: ${title}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`} className="group absolute inset-0 size-full">
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-90 transition-opacity duration-hover group-hover:opacity-100"
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-pill bg-leaf text-ink shadow-raised transition-transform duration-hover group-hover:scale-110 lg:size-20"
          >
            <svg viewBox="0 0 24 24" className="ml-1 size-7 lg:size-8" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  );
}
