/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B2A4A',
          50: '#E8EBF0',
          100: '#D1D7E1',
          200: '#A3AFB3',
          300: '#7587A5',
          400: '#4D6589',
          500: '#1B2A4A',
          600: '#162240',
          700: '#111A33',
          800: '#0C1226',
          900: '#070A19',
        },
        accent: {
          DEFAULT: '#E8652A',
          50: '#FFF3ED',
          100: '#FFE4D4',
          200: '#FFC5A3',
          300: '#FFA36B',
          400: '#F07D3A',
          500: '#E8652A',
          600: '#C94F16',
          700: '#A33E10',
          800: '#7D2F0C',
          900: '#572008',
        },
      },
    },
  },
  plugins: [],
};
