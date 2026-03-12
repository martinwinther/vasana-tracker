/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds — layered dark warmth
        void: "#0d0c0b", // page background
        surface: "#161412", // card / section background
        raised: "#1e1c19", // inputs, recessed elements

        // Text
        parchment: "#ddd4c8", // primary text
        ash: "#6b6460", // muted / secondary text

        // Category accents (tuned for readability on dark surfaces)
        moss: "#72a874", // Nourishing — sage green
        ember: "#c97a55", // Limiting   — warm terracotta
        clay: "#7a7068", // Neutral    — warm mid-grey

        // Focus indicator
        gold: "#c4974a",
      },
      boxShadow: {
        card: "0 4px 32px rgba(0, 0, 0, 0.55)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
