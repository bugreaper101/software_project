/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0a0a0b',
          900: '#111113',
          850: '#161618',
          800: '#1c1c1f',
          700: '#26262a',
          600: '#333339',
          500: '#45454d',
          400: '#6b6b75',
          300: '#9a9aa6',
          200: '#c8c8d0',
          100: '#e8e8ec',
        },
        gold: {
          50: '#fbf7ed',
          100: '#f6ecd2',
          200: '#ecd79f',
          300: '#e0bd66',
          400: '#d4a843',
          500: '#c4962f',
          600: '#a87a24',
          700: '#855e1f',
          800: '#5f441a',
          900: '#3e2d13',
        },
        cream: {
          50: '#fdfcf8',
          100: '#f9f5ec',
          200: '#f1e9d6',
          300: '#e7dabd',
        },
        wine: {
          500: '#7a1f2b',
          600: '#631822',
          700: '#4e131b',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.25em',
        widest3: '0.3em',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0,0)' },
          '100%': { transform: 'scale(1.12) translate(-1%,-2%)' },
        },
        'slide-up-fade': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '60%': { opacity: '1', transform: 'scale(1.03)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'expand-width': {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
        'fade-in': 'fade-in 1s ease forwards',
        'scale-in': 'scale-in 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-right': 'slide-right 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        shimmer: 'shimmer 2s linear infinite',
        'ken-burns': 'ken-burns 18s ease-out forwards',
        'slide-up-fade': 'slide-up-fade 0.6s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-in-right': 'slide-in-right 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'expand-width': 'expand-width 0.8s cubic-bezier(0.22,1,0.36,1) forwards',
      },
    },
  },
  plugins: [],
};
