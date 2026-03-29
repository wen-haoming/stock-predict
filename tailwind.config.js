/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0d1117',
        'bg-card': '#161b22',
        'text-primary': '#c9d1d9',
        'text-secondary': '#8b949e',
        'accent-blue': '#58a6ff',
        'up-color': '#3fb950',
        'down-color': '#f85149',
      }
    },
  },
  plugins: [],
}