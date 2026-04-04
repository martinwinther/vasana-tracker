/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Deep, contemplative background palette
        void: "#0f1115",    // deeper page background
        surface: "#1a1d23",  // main card background
        raised: "#252932",   // input and interactive elements

        // Refined typography
        parchment: "#f2efea", // slightly warmer/brighter primary text
        ash: "#949ba6",      // more balanced muted text

        // Cohesive, sophisticated accents
        moss: "#88d6a7",    // Nourishing (fresher)
        ember: "#ff9f80",   // Limiting (softer, more coral)
        clay: "#a3b1c2",    // Neutral (cooler)

        // Special accents
        gold: "#d4af37",    // Focus / In-focus accent
        accent: "#6366f1",  // Subtle indigo for UI actions
      },
      boxShadow: {
        card: "0 10px 40px -10px rgba(0, 0, 0, 0.5)",
        inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
      fontFamily: {
        display: ["Georgia", "serif"],
        body: ["Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
