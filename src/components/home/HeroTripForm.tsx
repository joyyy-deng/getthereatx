import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Place, Resource } from '../../content/schema';
import { Arrow } from '../ui/Arrow';
import { PlaceCombobox } from '../plan/PlaceCombobox';

/**
 * Figma "Trip planner" card on Home (787:6480): sky card with one rounded
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
      className="flex w-full flex-col gap-[14px] rounded-tr-poster bg-sky p-4 lg:gap-5 lg:rounded-tr-[37px] lg:px-5 lg:pb-6 lg:pt-5"
      onSubmit={(e) => {
        e.preventDefault();
        planTrip();
      }}
    >
      <h2
        id="hero-trip-title"
        className="m-0 text-fluid font-semibold leading-[1.15] tracking-[-0.01em] text-navy [--d:48] [--m:32] lg:font-bold lg:leading-[1.05] lg:tracking-[-2px]"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-[14px] sm:flex-row sm:items-center sm:gap-6">
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
            tone="white"
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
            tone="white"
          />
        </div>
        <button
          type="submit"
          aria-label={buttonLabel}
          className="grid size-16 shrink-0 place-items-center rounded-pill bg-navy text-bg transition-transform duration-hover hover:scale-105 lg:size-[124px]"
        >
          <Arrow className="size-7 lg:size-10" strokeWidth={2.2} />
        </button>
      </div>
    </form>
  );
}
