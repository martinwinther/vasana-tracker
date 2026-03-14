/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Backgrounds — still dark, but lifted for better comfort/contrast
        void: "#16181d", // page background
        surface: "#1f232b", // card / section background
        raised: "#2a2f39", // inputs, recessed elements

        // Text
        parchment: "#ece7de", // primary text
        ash: "#a9b0bc", // muted / secondary text

        // Category accents — cooler, more cohesive with slate-dark base
        moss: "#7fcf9a", // Nourishing
        ember: "#f29a74", // Limiting
        clay: "#93a1b5", // Neutral

        // Focus indicator
        gold: "#e0b968",
      },
      boxShadow: {
        card: "0 8px 30px rgba(0, 0, 0, 0.35)",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
