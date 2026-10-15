import { LinkIn } from '../components/ui';

/** Stand-in for screens built in later phases. */
export function Placeholder({ title, phase }: { title: string; phase: number }) {
  return (
    <section className="mx-auto flex max-w-content flex-col gap-6 px-8 py-24">
      <h1 className="m-0 text-h1">{title}</h1>
      <p className="m-0 text-body-lg text-ink-muted">This screen is built in Phase {phase}.</p>
      <LinkIn to="/dev/components" label="See the Phase 1 component gallery" />
    </section>
  );
}
