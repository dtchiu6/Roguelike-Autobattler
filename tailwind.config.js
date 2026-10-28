/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        astral: {
          gold: '#f3d79b',
          cyan: '#8ce8f7',
          violet: '#b9a3ff',
          ink: '#05030f',
          panel: '#0d0a20',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-gold': '0 0 18px rgba(243,215,155,0.35)',
        'glow-cyan': '0 0 22px rgba(140,232,247,0.32)',
        'glow-violet': '0 0 26px rgba(160,120,255,0.30)',
        'inner-astral': 'inset 0 0 60px rgba(120,80,200,0.16)',
      },
      keyframes: {
        floatUp: {
          '0%':   { transform: 'translate(-50%, 4px) scale(0.7)', opacity: '0' },
          '18%':  { transform: 'translate(-50%, -8px) scale(1.15)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -46px) scale(1)', opacity: '0' },
        },
        drift: {
          '0%,100%': { transform: 'translate3d(0,0,0)' },
          '50%':     { transform: 'translate3d(-18px,-24px,0)' },
        },
        pulseSlow: {
          '0%,100%': { opacity: '0.35' },
          '50%':     { opacity: '0.85' },
        },
        lunge: {
          '0%':   { transform: 'translate(-50%,-50%) scale(1)' },
          '40%':  { transform: 'translate(-50%,-50%) scale(1.18)' },
          '100%': { transform: 'translate(-50%,-50%) scale(1)' },
        },
      },
      animation: {
        'float-up': 'floatUp 850ms cubic-bezier(.2,.8,.3,1) forwards',
        drift: 'drift 24s ease-in-out infinite',
        'pulse-slow': 'pulseSlow 4s ease-in-out infinite',
        lunge: 'lunge 320ms ease-out',
      },
    },
  },
  plugins: [],
};