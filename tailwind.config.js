/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['"Noto Sans Arabic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
