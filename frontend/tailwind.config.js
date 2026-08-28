/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070a',
        surface: {
          DEFAULT: '#0b1017',
          raised: '#111927',
          overlay: '#161f2e',
        },
        border: {
          subtle: '#1c2635',
          DEFAULT: '#263344',
          strong: '#334255',
        },
        ink: {
          primary: '#e7edf5',
          secondary: '#9aa7b8',
          muted: '#647188',
        },
        accent: {
          DEFAULT: '#3fb6e8',
          hover: '#63c7f0',
          dim: '#1c4a5e',
          soft: '#0f2a38',
        },
        ok: { DEFAULT: '#31c48d', soft: '#0f2c22' },
        warn: { DEFAULT: '#e8a33d', soft: '#332310' },
        bad: { DEFAULT: '#e8555a', soft: '#331516' },
        water: { DEFAULT: '#4f8fe8', soft: '#0f1f38' },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.02) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
        glow: '0 0 0 1px rgba(63,182,232,0.35), 0 0 24px -4px rgba(63,182,232,0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'scan': 'scan 2.2s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
