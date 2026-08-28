/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep-space instrument backdrop — near-black with a faint warm undertone
        void: '#060707',
        surface: {
          DEFAULT: '#0c0d0f',
          raised: '#141618',
          overlay: '#1b1e22',
        },
        border: {
          subtle: '#1f2226',
          DEFAULT: '#2b2f35',
          strong: '#3c424a',
        },
        ink: {
          primary: '#f2ede3',
          secondary: '#a7a196',
          muted: '#6f6a61',
        },
        // SIGNATURE — solar amber / orbital telemetry glow (replaces cyan)
        accent: {
          DEFAULT: '#ff8a34',
          hover: '#ffa75f',
          dim: '#5c3312',
          soft: '#22150a',
        },
        // Supporting cool ion tone for data / water only
        ion: { DEFAULT: '#5fb2e6', soft: '#0d2030' },
        ok: { DEFAULT: '#34d39a', soft: '#062720' },
        warn: { DEFAULT: '#f2c14e', soft: '#2b2109' },
        bad: { DEFAULT: '#ff4d6a', soft: '#2c0d16' },
        water: { DEFAULT: '#5fb2e6', soft: '#0d2030' },
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Space Grotesk"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        // Crisper, instrument-panel geometry
        sm: '3px',
        DEFAULT: '4px',
        md: '5px',
        lg: '7px',
        xl: '10px',
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -16px rgba(0,0,0,0.7)',
        glow: '0 0 0 1px rgba(255,138,52,0.4), 0 0 22px -4px rgba(255,138,52,0.4)',
        'glow-lg': '0 0 0 1px rgba(255,138,52,0.5), 0 0 46px -6px rgba(255,138,52,0.55)',
        'panel-hover':
          '0 1px 0 0 rgba(255,255,255,0.05) inset, 0 0 0 1px rgba(255,138,52,0.18), 0 22px 60px -22px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        aurora:
          'radial-gradient(120% 120% at 0% 0%, rgba(255,138,52,0.15) 0%, transparent 44%), radial-gradient(120% 120% at 100% 0%, rgba(255,167,95,0.10) 0%, transparent 48%), radial-gradient(140% 140% at 50% 120%, rgba(95,178,230,0.09) 0%, transparent 55%)',
        'accent-gradient': 'linear-gradient(135deg, #ffb066 0%, #ff8a34 48%, #f2701a 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 2.4s cubic-bezier(0.4,0,0.6,1) infinite',
        scan: 'scan 2.2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 9s ease-in-out infinite',
        twinkle: 'twinkle 4s ease-in-out infinite',
        shimmer: 'shimmer 2.5s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        orbit: 'orbit 18s linear infinite',
        'orbit-reverse': 'orbit 26s linear infinite reverse',
        'fade-up': 'fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.5s ease-out both',
        'gradient-pan': 'gradient-pan 6s ease infinite',
        'route-in': 'route-in 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'aurora-pan': 'aurora-pan 24s ease-in-out infinite',
        shooting: 'shooting 6s ease-in infinite',
        'radar-sweep': 'radar-sweep 4s linear infinite',
        ticker: 'ticker 1.2s steps(1) infinite',
        'sweep-x': 'sweep-x 3.2s cubic-bezier(0.4,0,0.2,1) infinite',
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
        'route-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.995)', filter: 'blur(5px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        'aurora-pan': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.9' },
          '50%': { transform: 'translate3d(-3%,2%,0) scale(1.08)', opacity: '1' },
        },
        shooting: {
          '0%': { transform: 'translate3d(0,0,0) rotate(18deg)', opacity: '0' },
          '6%': { opacity: '1' },
          '18%': { transform: 'translate3d(-420px,150px,0) rotate(18deg)', opacity: '0' },
          '100%': { transform: 'translate3d(-420px,150px,0) rotate(18deg)', opacity: '0' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        ticker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'sweep-x': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '50%': { opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
