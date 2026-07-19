/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#d9e6ff',
          500: '#3b6ef6',
          600: '#2f57d0',
          700: '#2645a8',
        },
      },
    },
  },
  plugins: [],
}

