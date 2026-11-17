import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import pages from '../content/pages.json';
import type { Event } from '../content/schema';
import { sampleEvent } from '../dev/templateSamples';
import { expandEvent } from '../lib/recurrence';
import { renderPage } from '../test/render';
import { EventView } from './EventDetail';

const view = (event: Event, more = 3) => {
  const [occurrence] = expandEvent(event);
  const others = Array.from({ length: more }, (_, n) => ({ ...occurrence, event: { ...event, id: `o${n}`, slug: `other-${n}` } }));
  return renderPage(<EventView copy={pages.event} occurrence={occurrence} more={others} />);
};

const minimal: Event = {
  id: 'm', slug: 'm', status: 'published', lastReviewed: '2026-10-01',
  title: { en: 'Minimal event' }, blurb: { en: 'Short description' },
  start: '2026-12-05T13:00:00-06:00', end: '2026-12-05T16:00:00-06:00',
  venue: { name: 'Central Library', address: '710 W Cesar Chavez St' }, tags: [],
};

describe('event template', () => {
  it('header: back to Community, title, description', () => {
    view(sampleEvent);
    expect(screen.getByRole('link', { name: 'Back' })).toHaveAttribute('href', '/community#events');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Event title');
    expect(screen.getByText('Description')).toBeInTheDocument();
  });

  it('details card: date, time, place and the optional facts', () => {
    view(sampleEvent);
    const card = screen.getByRole('complementary', { name: 'Event details' });
    expect(within(card).getByText('Saturday, December 5, 2026')).toBeInTheDocument();
    expect(within(card).getByText('1:00 PM – 4:00 PM')).toBeInTheDocument();
    expect(within(card).getByText('Venue name')).toBeInTheDocument();
    expect(within(card).getByText('Street address')).toBeInTheDocument();
    for (const v of ['Free or price', 'Age range', 'Required or drop-in']) expect(within(card).getByText(v)).toBeInTheDocument();
  });

  it('Book now opens the event site in a new tab', () => {
    view(sampleEvent);
    const book = screen.getByRole('link', { name: /Book now/ });
    expect(book).toHaveAttribute('href', sampleEvent.url);
    expect(book).toHaveAttribute('target', '_blank');
    expect(book).toHaveTextContent('opens in a new tab');
  });

  it('Add to calendar downloads an .ics file', () => {
    view(sampleEvent);
    const cal = screen.getByRole('link', { name: 'Add to calendar' });
    expect(cal).toHaveAttribute('download', 'sample-event.ics');
    const ics = decodeURIComponent(cal.getAttribute('href')!.split(',').slice(1).join(','));
    expect(ics).toContain('SUMMARY:Event title');
    expect(ics).toContain('DTSTART:20261205T190000Z');
  });

  it('shows every section when the event has them', () => {
    view(sampleEvent);
    for (const t of ['What to bring/What you will gain', 'Hosted by', 'Accessibility', 'Getting there']) {
      expect(screen.getByRole('heading', { level: 2, name: t })).toBeInTheDocument();
    }
    expect(screen.getByText('Organizer name · Partner names').textContent).toBe('Organizer name  ·  Partner names');
    expect(screen.getAllByText('Item')).toHaveLength(3);
    expect(screen.getByText('Route and stop')).toBeInTheDocument();
  });

  it('hides empty sections and facts', () => {
    view(minimal, 0);
    for (const t of ['What to bring/What you will gain', 'Hosted by', 'Accessibility', 'Getting there', 'More events']) {
      expect(screen.queryByRole('heading', { name: t })).toBeNull();
    }
    for (const label of ['Cost', 'Ages', 'Registration']) expect(screen.queryByText(label)).toBeNull();
    // No website: no Book now, but Add to calendar still works.
    expect(screen.queryByRole('link', { name: /Book now/ })).toBeNull();
    expect(screen.getByRole('link', { name: 'Add to calendar' })).toBeInTheDocument();
  });

  it('Getting there takes any ways staff add (scooter, walking…), in their order', () => {
    const ways = [
      { label: 'Bus', details: 'Route 7, stop at 6th' },
      { label: 'Scooter', details: 'Docks on Lamar' },
      { label: 'Walk', details: '10 minutes from the rail station' },
      { label: 'Parking', details: 'Garage on 5th' },
    ];
    const { container } = view({ ...minimal, gettingThere: ways }, 0);
    expect(screen.getByRole('heading', { name: 'Getting there' })).toBeInTheDocument();
    const section = screen.getByRole('heading', { name: 'Getting there' }).parentElement!;
    expect([...section.querySelectorAll('dt')].map((d) => d.textContent)).toEqual(['Bus', 'Scooter', 'Walk', 'Parking']);
    expect(within(section).getByText('Docks on Lamar').tagName).toBe('DD');
    expect(container).toBeTruthy();
  });

  it('Hosted by shows just the organizer when there are no partners', () => {
    view({ ...minimal, organizer: { name: 'Yellow Bike Project' } }, 0);
    expect(screen.getByText('Yellow Bike Project').textContent).toBe('Yellow Bike Project');
  });

  it('More events: cards with the date and "View event" linking to each event page', () => {
    view(sampleEvent);
    const more = screen.getByRole('region', { name: 'More events' });
    const links = within(more).getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', '/community/events/other-0');
    expect(within(more).getAllByText('View event')).toHaveLength(3);
    expect(within(more).getAllByText('Sat, Dec 5')).toHaveLength(3);
  });
});
