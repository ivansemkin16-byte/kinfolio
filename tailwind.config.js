/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        desk: 'var(--color-desk)',
        canvas: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-soft': 'var(--color-surface-soft)',
        'surface-kraft': 'var(--color-surface-kraft)',
        'surface-green': 'var(--color-surface-green)',
        'surface-subtle': 'var(--color-surface-soft)',
        'receipt-bg': 'var(--color-receipt-bg)',
        'cover-leather': 'var(--color-cover-leather)',

        primary: 'var(--color-text-primary)',
        secondary: 'var(--color-text-secondary)',
        muted: 'var(--color-text-muted)',
        inverse: 'var(--color-text-inverse)',

        'btn-primary': 'var(--color-btn-primary)',
        'btn-primary-hover': 'var(--color-btn-primary-hover)',
        'btn-primary-text': 'var(--color-btn-primary-text)',

        green: {
          900: 'var(--color-green-900)',
          700: 'var(--color-green-700)',
          600: 'var(--color-green-600)',
          300: 'var(--color-green-300)',
          100: 'var(--color-green-100)',
        },

        accent: {
          DEFAULT: 'var(--color-green-100)',
          hover: 'var(--color-green-300)',
          dark: 'var(--color-green-900)',
          soft: 'var(--color-surface-soft)',
        },

        border: {
          subtle: 'var(--color-border)',
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },

        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        'warning-bg': 'var(--color-warning-bg)',
        'warning-text': 'var(--color-warning-text)',
        'warning-border': 'var(--color-warning-border)',

        danger: 'var(--color-danger)',
        'danger-bg': 'var(--color-danger-bg)',
        'danger-text': 'var(--color-danger-text)',
        'danger-border': 'var(--color-danger-border)',

        info: 'var(--color-info)',
        'info-bg': 'var(--color-info-bg)',
        'info-text': 'var(--color-info-text)',
        'info-border': 'var(--color-info-border)',
      },
      fontFamily: {
        sans: ['"Manrope"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        serif: ['"Lora"', 'Georgia', 'Charter', 'serif'],
        display: ['"Lora"', 'Georgia', 'Charter', 'serif'],
        hand: ['"Caveat"', 'cursive', 'serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        subtle: 'var(--shadow-soft)',
        soft: 'var(--shadow-soft)',
        card: 'var(--shadow-card)',
        modal: 'var(--shadow-modal)',
        book: 'var(--shadow-book)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        DEFAULT: 'var(--radius-md)',
      },
    },
  },
  plugins: [],
};
