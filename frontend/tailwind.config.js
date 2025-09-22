/** @type {import('tailwindcss').Config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primaryGreen: "#1E824C", // Main brand/CTA
        accentMint: "#A9DFBF",   // Background/hover
        deepForest: "#145A32",   // Support/contrast
        vibrantCta: "#2ECC71",   // Highlight/CTA
        softGray: "#F2F4F4",     // Light background
        textGray: "#555555",     // Text color
        white: "#FFFFFF",        // Canvas color
      },
    },
  },
  plugins: [],
};
