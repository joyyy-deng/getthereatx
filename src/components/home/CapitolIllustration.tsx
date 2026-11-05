import { asset } from '../../lib/asset';
import { cx } from '../../lib/cx';

// Figma "Sloth bus capitol (vector)" (787:6499): six layers stacked at the
// Figma insets, so the art scales as one picture from phone to desktop.
const LAYERS = [
  { src: 'sky', inset: 'inset-0' },
  { src: 'sun', inset: 'inset-[2.33%_4.64%_81.4%_75.36%]' },
  { src: 'skyline', inset: 'inset-[31.25%_0_0_0]' },
  { src: 'capitol', inset: 'inset-[1.45%_30.36%_48.84%_19.64%]' },
  { src: 'capitol-windows', inset: 'inset-[25%_33.93%_52.03%_23.21%]' },
  { src: 'bus', inset: 'inset-[20.78%_18.04%_0_13.39%]' },
];

export function CapitolIllustration({ alt, className }: { alt: string; className?: string }) {
  return (
    <div role="img" aria-label={alt} className={cx('relative aspect-[560/688] overflow-hidden bg-bg', className)}>
      {LAYERS.map((l) => (
        <div key={l.src} className={cx('absolute', l.inset)}>
          <img src={asset(`/images/home/hero/${l.src}.svg`)} alt="" className="block size-full max-w-none" />
        </div>
      ))}
    </div>
  );
}
