/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        'primary-green': '#1E824C',
        'accent-mint': '#A9DFBF',
        'deep-forest': '#145A32',
        'vibrant-cta': '#2ECC71',
        'soft-gray': '#F2F4F4',
        'text-gray': '#555555',
        'white': '#FFFFFF',
      },
      animation: {
        'spin-slow': 'spin 20s linear infinite',
      },
      maxWidth: {
        'root': '1280px',
      },
    },
  },
  plugins: [],
};
