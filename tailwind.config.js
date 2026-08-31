/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0A0F1A',
        navy2: '#111826',
        gold: '#F0B94F',
        blue: '#5E9BD8'
      }
    }
  },
  plugins: []
};
