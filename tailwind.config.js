/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#567257',
          brown: '#896A58',
          dark: '#2A2420',
          khaki: '#ACAB9E',
          beige: '#D9D8D5',
        },
      },
    },
  },
  plugins: [],
};

