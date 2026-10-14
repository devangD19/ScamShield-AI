/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Human-Crafted Editorial palette
        primary: {
          DEFAULT: '#155B46',
          hover: '#104735',
          soft: '#1C7057',
        },
        canvas: '#FAF8F0',
        surface: '#FFFFFF',
        sage: {
          DEFAULT: '#E8F0E4',
          deep: '#D8E5D0',
        },
        ink: '#183B32',
        muted: '#68766D',
        line: '#E5E5D7',
        risk: {
          low: '#16805D',
          medium: '#D97706',
          high: '#DC2626',
        },
        amber: {
          soft: '#FBEBD5',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        accent: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 59, 50, 0.04), 0 8px 24px -16px rgba(24, 59, 50, 0.25)',
        raised: '0 2px 4px rgba(24, 59, 50, 0.05), 0 18px 40px -24px rgba(24, 59, 50, 0.35)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
