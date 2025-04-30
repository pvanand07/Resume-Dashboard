/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f7ff',
          100: '#e0f1ff',
          200: '#c0e4ff',
          300: '#91d2ff',
          400: '#61b8ff',
          500: '#3498ff',
          600: '#1f7af0',
          700: '#1663dc',
          800: '#1650b3',
          900: '#17468e',
        },
        secondary: {
          50: '#f2f7fb',
          100: '#e6f0f9',
          200: '#cce1f3',
          300: '#a0c8e7',
          400: '#70a9d8',
          500: '#4f8cc9',
          600: '#3b6fbf',
          700: '#325aaa',
          800: '#2d4b8a',
          900: '#28406e',
        },
        accent: {
          50: '#f3f1ff',
          100: '#ebe5ff',
          200: '#d9ceff',
          300: '#bfa7ff',
          400: '#a175ff',
          500: '#8c4eff',
          600: '#7e33f5',
          700: '#6b21dd',
          800: '#591db3',
          900: '#4a1991',
        },
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          700: '#b45309',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
  future: {
    hoverOnlyWhenSupported: true,
  },
};