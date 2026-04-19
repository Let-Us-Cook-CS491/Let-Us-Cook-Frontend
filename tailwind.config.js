/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'auth-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'auth-fade-in': 'auth-fade-in 0.2s ease-out',
      },
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

