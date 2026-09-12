/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        foreground: 'var(--color-fg)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          elevated: 'var(--color-surface-elevated)',
          hover: 'var(--color-surface-hover)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          hover: 'var(--color-border-hover)',
        },
        muted: 'var(--color-text-muted)',
        brand: {
          orange: '#FF6129',
          red: '#FC3B00',
          coral: '#FF7145',
          warmWhite: '#FFFDF5',
        },
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          light: 'var(--color-primary-light)',
        },
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'Oswald', '"Bebas Neue"', 'sans-serif'],
        display: ['"Barlow Condensed"', 'Oswald', '"Bebas Neue"', 'sans-serif'],
        sans: ['Geist', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'message-in': 'messageIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        /* Keep landing page animations */
        'liquid-spin': 'liquidSpin 28s infinite ease-in-out',
        'liquid-reverse': 'liquidSpinRev 32s infinite ease-in-out',
        'cinematic-drift': 'cinematicDrift 45s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'scale(0.98)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        messageIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cinematicDrift: {
          '0%': { transform: 'scale(1) translate(0px, 0px)' },
          '50%': { transform: 'scale(1.08) translate(-15px, -10px)' },
          '100%': { transform: 'scale(1) translate(0px, 0px)' },
        },
        liquidSpin: {
          '0%': { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
          '33%': { transform: 'translate(60px, -40px) scale(1.15) rotate(120deg)' },
          '66%': { transform: 'translate(-40px, 50px) scale(0.9) rotate(240deg)' },
          '100%': { transform: 'translate(0px, 0px) scale(1) rotate(360deg)' },
        },
        liquidSpinRev: {
          '0%': { transform: 'translate(0px, 0px) scale(1) rotate(360deg)' },
          '33%': { transform: 'translate(-50px, 40px) scale(1.1) rotate(240deg)' },
          '66%': { transform: 'translate(40px, -50px) scale(0.95) rotate(120deg)' },
          '100%': { transform: 'translate(0px, 0px) scale(1) rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
};
