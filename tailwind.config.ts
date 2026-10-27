import type { Config } from 'tailwindcss';

// Every value points at a CSS variable in src/styles/tokens.css.
// Components use role tokens (bg-action, text-ink-muted), never raw hex.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#FFFFFF',
      bg: 'var(--color-bg)',
      'surface-muted': 'var(--color-surface-muted)',
      ink: 'var(--color-ink)',
      'ink-muted': 'var(--color-ink-muted)',
      border: 'var(--color-border)',
      'border-strong': 'var(--color-border-strong)',
      'border-control': 'var(--color-border-control)',
      action: 'var(--color-action)',
      'action-hover': 'var(--color-action-hover)',
      link: 'var(--color-link)',
      focus: 'var(--color-focus)',
      placeholder: 'var(--color-placeholder)',
      brand: {
        bluebonnet: 'var(--brand-bluebonnet)',
        navy: 'var(--brand-navy)',
        yellow: 'var(--brand-yellow)',
        green: 'var(--brand-green)',
      },
      mode: {
        walk: 'var(--mode-walk)',
        bike: 'var(--mode-bike)',
        bus: 'var(--mode-bus)',
        rail: 'var(--mode-rail)',
        carpool: 'var(--mode-carpool)',
        drive: 'var(--mode-drive)',
      },
      alert: {
        'info-bg': 'var(--alert-info-bg)',
        'info-ink': 'var(--alert-info-ink)',
        'advisory-bg': 'var(--alert-advisory-bg)',
        'advisory-ink': 'var(--alert-advisory-ink)',
        'advisory-border': 'var(--alert-advisory-border)',
        'disruption-bg': 'var(--alert-disruption-bg)',
        'disruption-ink': 'var(--alert-disruption-ink)',
        'disruption-border': 'var(--alert-disruption-border)',
      },
    },
    fontFamily: {
      sans: ['"Geist Sans"', 'system-ui', 'sans-serif'],
      mono: ['"Geist Mono"', 'ui-monospace', 'monospace'],
    },
    // Sizes come from tokens.css so phones can use a smaller scale.
    fontSize: {
      display: ['var(--text-display)', { lineHeight: '1', letterSpacing: '-0.05em', fontWeight: '400' }],
      h1: ['var(--text-h1)', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '400' }],
      h2: ['var(--text-h2)', { lineHeight: '1.15', letterSpacing: '-0.03em', fontWeight: '400' }],
      h3: ['var(--text-h3)', { lineHeight: '1.25', letterSpacing: '-0.02em', fontWeight: '500' }],
      h4: ['var(--text-h4)', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '500' }],
      'body-lg': ['var(--text-body-lg)', { lineHeight: '1.6' }],
      body: ['var(--text-body)', { lineHeight: '1.6' }],
      small: ['var(--text-small)', { lineHeight: '1.5' }],
      eyebrow: ['var(--text-eyebrow)', { lineHeight: '1.25', letterSpacing: '0.12em', fontWeight: '500' }],
      'data-xl': ['var(--text-data-xl)', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '400' }],
      // Mode-card times on Plan Your Trip (the compact results panel).
      'data-lg': ['var(--text-data-lg)', { lineHeight: '1', letterSpacing: '-0.04em', fontWeight: '400' }],
      data: ['var(--text-data)', { lineHeight: '1.4' }],
      // Nav links and footer labels, sized from the Figma Nav Bar / Footer frames.
      nav: ['var(--text-nav)', { lineHeight: '33px', letterSpacing: '-0.66px' }],
      label: ['var(--text-label)', { lineHeight: '15px', letterSpacing: '1.4px' }],
    },
    spacing: {
      0: '0',
      px: '1px',
      0.5: '2px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      24: '96px',
      32: '128px',
    },
    borderRadius: {
      none: 'var(--radius-none)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      pill: 'var(--radius-pill)',
    },
    extend: {
      maxWidth: {
        content: 'var(--container-content)',
        frame: 'var(--container-frame)',
      },
      boxShadow: {
        raised: 'var(--elevation-raised)',
      },
      transitionDuration: {
        hover: 'var(--motion-hover)',
        panel: 'var(--motion-panel)',
      },
    },
  },
  plugins: [],
} satisfies Config;
