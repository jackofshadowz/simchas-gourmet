/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        olive: {
          50: '#f9faf5',
          100: '#f1f4e8',
          200: '#dfe5cc',
          300: '#c5cea8',
          400: '#a7b280',
          500: '#899462',
          600: '#6b764e',
          700: '#4f573a',
          800: '#363c28',
          900: '#1e2116',
        },
      },
    },
  },
  plugins: [],
};