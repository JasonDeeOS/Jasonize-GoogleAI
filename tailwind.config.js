/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        primary: 'var(--color-primary)',
        'primary-variant': 'var(--color-primary-variant)',
        secondary: 'var(--color-secondary)',
        'secondary-variant': 'var(--color-secondary-variant)',
        'on-background': 'var(--color-on-background)',
        'on-surface': 'var(--color-on-surface)',
        'on-primary': 'var(--color-on-primary)',
        'on-secondary': 'var(--color-on-secondary)',
        danger: 'var(--color-danger)',
      },
      keyframes: {
        'fade-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'highlight-pulse': {
          '0%': { boxShadow: '0 0 0 0 rgba(251, 146, 60, 0.4)' },
          '70%': { boxShadow: '0 0 0 6px rgba(251, 146, 60, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(251, 146, 60, 0)' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in-right': 'fade-in-right 0.5s ease-out forwards',
        'scale-in': 'scale-in 0.3s ease-out forwards',
        'highlight-pulse': 'highlight-pulse 1s ease-out',
        'slide-in-up': 'slide-in-up 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
