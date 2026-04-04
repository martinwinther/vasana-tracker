/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Minimal Obsidian-inspired dark neutrals (muted, low-contrast)
        void: "#232729",
        surface: "#2f3437",
        raised: "#3e4245",

        // Softer text hierarchy
        parchment: "#d8dee9",
        ash: "#9ea7b3",

        // Semantic accents kept color-coded, but toned down
        moss: "#b4cd9d",
        ember: "#e09a82",
        clay: "#9ab3cd",

        // Special accents
        gold: "#b39b73",
        accent: "#88c0d0",
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
        display: ["Fraunces", "serif"],
        body: ["Instrument Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
