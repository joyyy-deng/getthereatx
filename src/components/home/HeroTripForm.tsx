import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Place, Resource } from '../../content/schema';
import { PlaceCombobox } from '../plan/PlaceCombobox';

/** Home hero From / To. Submitting opens /plan?from=…&to=… */
export function HeroTripForm({
  places,
  googleMaps,
  buttonLabel,
}: {
  places: Place[];
  googleMaps?: Resource;
  buttonLabel: string;
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
      className="flex flex-col gap-4 pt-[20px]"
      onSubmit={(e) => {
        e.preventDefault();
        planTrip();
      }}
    >
      <div className="flex flex-col gap-4 md:flex-row">
        <PlaceCombobox
          label="From"
          placeholder="Enter starting point"
          places={places}
          value={from}
          other={to}
          otherNote="Your destination"
          side="from"
          googleMaps={googleMaps}
          onChange={setFrom}
          tone="light"
          className="w-full md:w-[240px]"
        />
        <PlaceCombobox
          label="To"
          placeholder="Enter destination"
          places={places}
          value={to}
          other={from}
          otherNote="Your starting point"
          side="to"
          googleMaps={googleMaps}
          onChange={setTo}
          tone="light"
          className="w-full md:w-[240px]"
        />
      </div>
      <div className="pt-2">
        <button
          type="submit"
          className="rounded-sm bg-brand-navy px-8 py-3 text-label uppercase text-white transition-opacity duration-hover hover:opacity-90"
        >
          {buttonLabel} →
        </button>
      </div>
    </form>
  );
}
