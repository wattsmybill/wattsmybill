/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx,mdx}",
    "./pages/**/*.{js,jsx,ts,tsx,mdx}",
    "./components/**/*.{js,jsx,ts,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wmb: {
          navy: "#06142b",
          bg: "#eef3f1",
          card: "#f7f8f8",
          emeraldDeep: "#075e49",
          emeraldMid: "#058761",
          tealDeep: "#10a889",
          green: "#059669",
          greenSoft: "#dff8ef",
          greenLine: "rgba(16, 185, 129, 0.28)",
        },
      },
      boxShadow: {
        "wmb-card":
          "0 10px 28px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.75)",
        "wmb-card-hover":
          "0 14px 36px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.85)",
        "wmb-hero":
          "0 12px 28px rgba(15, 23, 42, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "wmb-hero-hover":
          "0 14px 32px rgba(15, 23, 42, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
      },
      backgroundImage: {
        "wmb-hero":
          "linear-gradient(120deg, #075e49 0%, #058761 45%, #10a889 100%)",
        "wmb-hero-depth":
          "linear-gradient(120deg, #075e49 0%, #058761 45%, #10a889 100%)",
      },
      borderRadius: {
        "wmb-xl": "1.25rem",
        "wmb-2xl": "1.5rem",
        "wmb-3xl": "1.75rem",
      },
    },
  },
  plugins: [],
};