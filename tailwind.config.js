/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(20, 120, 237)',
          50: 'rgba(20, 120, 237, 0.1)',
          100: 'rgba(20, 120, 237, 0.2)',
          200: 'rgba(20, 120, 237, 0.3)',
          300: 'rgba(20, 120, 237, 0.4)',
          400: 'rgba(20, 120, 237, 0.5)',
          500: 'rgb(20, 120, 237)',
          600: 'rgb(18, 108, 213)',
          700: 'rgb(16, 95, 189)',
          800: 'rgb(13, 83, 166)',
          900: 'rgb(11, 71, 142)',
        }
      },
      height: {
        '120': '480px',
      },
    },
  },
  plugins: [],
} 