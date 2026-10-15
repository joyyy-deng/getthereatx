import { useEffect, useState, type ReactNode } from 'react';
import type { Alert, Post, Program, Resource } from '../content/schema';
import { getAlerts, getEvents, getPosts, getPrograms, getResources, type Occurrence } from '../data';
import {
  AlertBanner,
  Button,
  Chip,
  EditorialCard,
  Eyebrow,
  LinkIn,
  LinkOut,
  ResourceList,
  ResourceRow,
  SectionHeader,
  Tabs,
} from '../components/ui';
import { text } from '../lib/i18n';

// Hidden review page (/dev/components): every core component and state,
// plus a readout of the content layer. Not linked from the site.

const STUDENT_TABS = [
  { id: 'free', label: 'Free rides', ids: ['capmetro-ut-id', 'ut-shuttles', 'ut-shop-shuttle'] },
  { id: 'bikes', label: 'Bikes & scooters', ids: ['metrobike', 'austin-bike-map'] },
  { id: 'late', label: 'Late night', ids: ['late-night'] },
  { id: 'cars', label: 'Cars & carpool', ids: ['ut-carpool', 'park-ride'] },
];

// Component states only. These are not content: alerts.json stays empty.
const SAMPLE_ALERTS: Alert[] = (['info', 'advisory', 'disruption'] as const).map((severity) => ({
  id: `gallery-${severity}`,
  slug: `gallery-${severity}`,
  status: 'published',
  lastReviewed: '2026-10-15',
  expiresAt: '2099-01-01T00:00:00Z',
  severity,
  placement: ['sitewide'],
  message: { en: `Sample ${severity} banner, shown here only to review the component.` },
  link: { label: { en: 'Check delays & detours' }, url: 'https://www.capmetro.org/alerts' },
}));

const when = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/Chicago',
});

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6 border-t border-border-strong py-12">
      <h2 className="m-0 text-h3">{title}</h2>
      {children}
    </section>
  );
}

function State({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

export function ComponentGallery() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [events, setEvents] = useState<Occurrence[]>([]);
  const [tab, setTab] = useState(STUDENT_TABS[0].id);
  const [chips, setChips] = useState<string[]>(['cost']);

  useEffect(() => {
    const now = new Date();
    getResources().then(setResources);
    getPosts().then(setPosts);
    getPrograms().then(setPrograms);
    getAlerts(now).then(setAlerts);
    getEvents({ from: now, to: new Date(now.getTime() + 60 * 86_400_000) }).then(setEvents);
  }, []);

  const byId = (id: string) => resources.find((r) => r.id === id);
  const tabRows = STUDENT_TABS.find((t) => t.id === tab)!
    .ids.map(byId)
    .filter((r): r is Resource => !!r);
  const toggle = (id: string) => setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  const carpool = byId('ut-carpool');
  const goldenRollers = events.filter((o) => o.event.id === 'golden-rollers');

  return (
    <div className="mx-auto max-w-content px-8 py-16">
      <SectionHeader level={1} eyebrow="Phase 1 review" title="Components & content" />
      <p className="mt-6 text-body-lg text-ink-muted">
        Hover, focus (Tab key) and press each control to check its states. → stays on the site; ↗ opens another site in
        a new tab.
      </p>

      <Section title="Button">
        <div className="grid grid-cols-3 gap-8">
          {(['primary', 'secondary', 'ghost'] as const).map((v) => (
            <div key={v} className="flex flex-col items-start gap-4">
              <State label={`${v} · default`}>
                <Button variant={v}>Plan your trip</Button>
              </State>
              <State label={`${v} · disabled`}>
                <Button variant={v} disabled>
                  Plan your trip
                </Button>
              </State>
              <State label={`${v} · loading`}>
                <Button variant={v} loading>
                  Plan your trip
                </Button>
              </State>
            </div>
          ))}
        </div>
      </Section>

      <Section title="LinkOut ↗ and LinkIn →">
        <div className="flex flex-wrap items-end gap-8">
          <State label="LinkOut · inline">
            <LinkOut
              href="https://drivetexas.org/"
              provider="TxDOT"
              label="Check traffic on DriveTexas"
              from="gallery"
            />
          </State>
          <State label="LinkOut · button">
            <LinkOut
              as="button"
              href="https://www.capmetro.org/ride/plan/trip-planner"
              provider="CapMetro"
              label="Plan on CapMetro"
              resourceId="capmetro-planner"
              from="gallery"
            />
          </State>
          <State label="LinkOut · ghost">
            <LinkOut
              as="button"
              variant="ghost"
              href="https://www.capmetro.org/park-ride"
              provider="CapMetro"
              label="Try Park & Ride"
              from="gallery"
            />
          </State>
          <State label="LinkIn · inline">
            <LinkIn to="/plan" label="Plan this trip" />
          </State>
        </div>
        <State label="LinkIn · row">
          <div className="flex w-full flex-col gap-4">
            <LinkIn as="row" to="/dev/components" label="Taking the bus for the first time" />
            <LinkIn as="row" to="/dev/components" label="Bringing a bike on public transit" />
          </div>
        </State>
      </Section>

      <Section title="Chip">
        <div className="flex flex-wrap gap-2">
          {[
            ['cost', 'Lowest cost'],
            ['safe', 'Safest route'],
            ['walk', 'Less walking'],
            ['carry', 'Carrying stuff'],
          ].map(([id, label]) => (
            <Chip key={id} label={label} selected={chips.includes(id)} onClick={() => toggle(id)} />
          ))}
        </div>
      </Section>

      <Section title="Tabs + ResourceRow (student)">
        <Tabs label="Student trip types" items={STUDENT_TABS} value={tab} onChange={setTab}>
          <ResourceList>
            {tabRows.map((r) => (
              <ResourceRow key={r.id} resource={r} from="gallery" />
            ))}
          </ResourceList>
        </Tabs>
      </Section>

      <Section title="ResourceRow (directory)">
        <ResourceList>
          {['drivetexas', 'austin-bike-map', 'capmetro-access'].map((id) => {
            const r = byId(id);
            return r && <ResourceRow key={id} resource={r} variant="directory" from="gallery" />;
          })}
        </ResourceList>
      </Section>

      <Section title="SectionHeader + EditorialCard">
        <SectionHeader
          eyebrow="Connect"
          title="Try something new with other people."
          aside="Local events and programs can make unfamiliar transportation options feel more comfortable. These are good places to connect with the Austin community and try out a route."
        />
        <div className="grid grid-cols-3 gap-4">
          {carpool && (
            <EditorialCard
              title="Students"
              image={{ src: '/images/home/card-students.png', alt: 'Carpool program only takes 2' }}
              body="The University of Texas at Austin carpool program supports efforts to reduce traffic congestion and curb vehicle pollution in Austin. Students can share the commute with a fellow Longhorn and get around Austin."
              action={
                <LinkOut
                  href={carpool.url}
                  provider={carpool.provider}
                  label={carpool.action}
                  resourceId={carpool.id}
                  from="gallery"
                />
              }
            />
          )}
        </div>
      </Section>

      <Section title="AlertBanner">
        <p className="m-0 text-small text-ink-muted">
          Samples for review only. alerts.json is empty, so no alert shows on the site ({alerts.length} live).
          Dismissing hides a banner until the tab is closed.
        </p>
        <div className="flex flex-col gap-2">
          {SAMPLE_ALERTS.map((a) => (
            <AlertBanner key={a.id} alert={a} />
          ))}
        </div>
      </Section>

      <Section title="Content layer">
        <ul className="m-0 grid list-none grid-cols-2 gap-2 p-0 font-mono text-data">
          <li>{resources.length} resources</li>
          <li>{posts.length} live posts (Spring Festival guide auto-hidden)</li>
          <li>{programs.length} programs</li>
          <li>{alerts.length} live alerts</li>
          <li>{events.length} event dates in the next 60 days, from 5 records</li>
        </ul>
        <State label="Golden Rollers: one record, expanded">
          <ul className="m-0 list-none p-0 font-mono text-data tabular">
            {goldenRollers.map((o) => (
              <li key={o.start.toISOString()}>{when.format(o.start)}</li>
            ))}
          </ul>
        </State>
        <State label="Posts (summary = live excerpt)">
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {posts.slice(0, 4).map((p) => (
              <li key={p.id} className="text-small">
                <LinkOut href={p.url} provider="GetThereATX" label={text(p.title)} from="gallery" />
                <span className="block text-ink-muted">{text(p.summary)}</span>
              </li>
            ))}
          </ul>
        </State>
      </Section>
    </div>
  );
}
