import type { Event, Post } from '../content/schema';

// Figma's own placeholder text for the two templates, word for word, so
// /dev/templates/blog and /dev/templates/event show every block and section
// exactly as designed. Dev pages only: never shown on the site, never content.

const sampleImage = { src: '/images/home/first-bus-ride.jpg', alt: 'Sample image' };

const base = { status: 'published', lastReviewed: '2026-10-01' } as const;

export const sampleTable = {
  type: 'table',
  columns: ['Column one', 'Column two', 'Column three'],
  rows: [
    ['Row label', 'Detail text', 'Detail text'],
    ['Row label', 'Detail text', 'Detail text'],
    ['Row label', 'Detail text', 'Detail text'],
  ],
} as const;

/** Figma 980:1883 / 981:2335, mobile wording for the facts strip and summary. */
export const samplePost: Post = {
  ...base,
  id: 'sample-blog',
  slug: 'sample-blog',
  title: { en: 'Article title goes here' },
  summary: { en: 'A one or two sentence summary that tells readers what they will learn and why it matters.' },
  image: sampleImage,
  url: 'https://www.getthereatx.com/',
  categories: ['biking-austin'],
  modes: ['bike'],
  audiences: ['everyone'],
  needs: ['learn-how'],
  body: [
    {
      type: 'facts',
      items: [
        { label: 'Stations', value: '75+ across Austin' },
        { label: 'Hours', value: 'Open 24/7' },
        { label: 'Bikes', value: '100% electric' },
      ],
    },
    { type: 'heading', text: 'Section heading' },
    {
      type: 'paragraph',
      text: 'Body paragraph. Keep it short and friendly, with one idea per paragraph so people can scan it quickly. Explain unfamiliar words the first time you use them.',
    },
    { type: 'tip', text: 'A helpful reminder, safety note, or insider tip that is worth pulling out of the main text.' },
    { type: 'heading', text: 'How it works' },
    {
      type: 'steps',
      items: [
        { title: 'Find a station', text: ['Open the map or app to see nearby bikes and open docks.'] },
        { title: 'Unlock a bike', text: ['Scan the code or enter your account details at the dock.'] },
        { title: 'Ride to your stop', text: ['Use bike lanes and trails when you can, and follow traffic signals.'] },
        { title: 'Return it', text: ['Dock the bike at any open station and check that it locked.'] },
      ],
    },
    { type: 'image', src: sampleImage.src, alt: sampleImage.alt, caption: 'Caption describing the image' },
    { type: 'heading', text: 'Section heading' },
    { ...sampleTable, columns: [...sampleTable.columns], rows: sampleTable.rows.map((r) => [...r]) },
    { type: 'button', label: 'Primary action', href: '/plan' },
  ],
};

export const sampleRelated: Post[] = [1, 2, 3].map((n) => ({
  ...samplePost,
  id: `sample-related-${n}`,
  slug: `sample-related-${n}`,
  title: { en: 'Related article title' },
  body: undefined,
}));

/** Figma 1014:2549 / 1015:277. */
export const sampleEvent: Event = {
  ...base,
  id: 'sample-event',
  slug: 'sample-event',
  title: { en: 'Event title' },
  blurb: { en: 'Description' },
  start: '2026-12-05T13:00:00-06:00',
  end: '2026-12-05T16:00:00-06:00',
  venue: { name: 'Venue name', address: 'Street address' },
  image: sampleImage,
  url: 'https://www.getthereatx.com/',
  tags: [],
  cost: 'Free or price',
  ages: 'Age range',
  registration: 'Required or drop-in',
  whatToBring: ['Item', 'Item', 'Item'],
  organizer: { name: 'Organizer name', partners: 'Partner names' },
  contact: 'Contact email or phone',
  accessibility: 'Accessibility details and how to request accommodations',
  gettingThere: [
    { label: 'Bus', details: 'Route and stop' },
    { label: 'Bike', details: 'Nearest station or racks' },
    { label: 'Parking', details: 'Parking details' },
  ],
};
