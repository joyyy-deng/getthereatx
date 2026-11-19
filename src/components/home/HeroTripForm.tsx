import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Place, Resource } from '../../content/schema';
import { Arrow } from '../ui/Arrow';
import { text } from '../../lib/i18n';
import { PlaceCombobox } from '../plan/PlaceCombobox';

/** Motion Lab "Rolling examples": places the empty fields roll through (ids in places.json). */
const FROM_EXAMPLES = ['ut-austin', 'downtown', 'east-riverside', 'hyde-park'];
const TO_EXAMPLES = ['mueller', 'domain', 'zilker', 'airport'];

/**
 * Figma "Trip planner" card on Home (desktop 775:3259, phone 865:5600): sky card with one rounded
 * corner, From / To fields and a round navy button. Submitting opens
 * /plan?from=…&to=… (either can be empty).
 */
export function HeroTripForm({
  title,
  buttonLabel,
  fromPlaceholder,
  toPlaceholder,
  places,
  googleMaps,
}: {
  title: string;
  buttonLabel: string;
  fromPlaceholder: string;
  toPlaceholder: string;
  places: Place[];
  googleMaps?: Resource;
}) {
  const [from, setFrom] = useState<Place>();
  const [to, setTo] = useState<Place>();
  const navigate = useNavigate();
  const examples = (ids: string[]) =>
    ids.map((id) => places.find((p) => p.id === id)).filter((p): p is Place => !!p).map((p) => text(p.name));

  function planTrip() {
    const p = new URLSearchParams();
    if (from) p.set('from', from.id);
    if (to) p.set('to', to.id);
    const qs = p.toString();
    navigate(qs ? `/plan?${qs}` : '/plan');
  }

  return (
    <form
      aria-labelledby="hero-trip-title"
      className="flex w-full flex-col gap-[14px] rounded-tr-[30px] bg-sky p-4 lg:gap-5 lg:rounded-tr-[37px] lg:px-5 lg:pb-8 lg:pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        planTrip();
      }}
    >
      <h2
        id="hero-trip-title"
        className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-navy [--d:57] [--m:32] lg:leading-[1.05] lg:text-ink"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-[14px] lg:flex-row lg:items-center lg:gap-6">
        <div className="flex flex-1 flex-col gap-[14px] lg:gap-6">
          <PlaceCombobox
            label="From"
            placeholder={fromPlaceholder}
            places={places}
            value={from}
            other={to}
            otherNote="Your destination"
            side="from"
            googleMaps={googleMaps}
            onChange={setFrom}
            examples={examples(FROM_EXAMPLES)}
            tone="white"
            chevron={false}
          />
          <PlaceCombobox
            label="To"
            placeholder={toPlaceholder}
            places={places}
            value={to}
            other={from}
            otherNote="Your starting point"
            side="to"
            googleMaps={googleMaps}
            onChange={setTo}
            examples={examples(TO_EXAMPLES)}
            tone="white"
            chevron={false}
          />
        </div>
        <button
          type="submit"
          aria-label={buttonLabel}
          // No hover animation (Joy 2026-11-19).
          className="grid size-16 shrink-0 place-items-center rounded-pill bg-navy text-bg lg:size-[124px]"
        >
          <Arrow still className="size-7 lg:size-10" />
        </button>
      </div>
    </form>
  );
}
