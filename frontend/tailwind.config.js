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
        'glow-lg': '0 0 0 1px rgba(63,182,232,0.4), 0 0 40px -6px rgba(63,182,232,0.5)',
        'panel-hover':
          '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(63,182,232,0.15), 0 18px 48px -18px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        'aurora':
          'radial-gradient(120% 120% at 0% 0%, rgba(63,182,232,0.16) 0%, transparent 45%), radial-gradient(120% 120% at 100% 0%, rgba(79,143,232,0.14) 0%, transparent 50%), radial-gradient(140% 140% at 50% 120%, rgba(49,196,141,0.10) 0%, transparent 55%)',
        'accent-gradient': 'linear-gradient(135deg, #63c7f0 0%, #3fb6e8 45%, #4f8fe8 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        'scan': 'scan 2.2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'orbit': 'orbit 18s linear infinite',
        'orbit-reverse': 'orbit 26s linear infinite reverse',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'gradient-pan': 'gradient-pan 6s ease infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.08)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-pan': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
    },
  },
  plugins: [],
}
