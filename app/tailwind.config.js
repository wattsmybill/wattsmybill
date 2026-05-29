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
          emeraldDeep: "#064e3b",
          emeraldMid: "#067a5f",
          tealDeep: "#0f766e",
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
          "0 20px 70px rgba(4, 120, 87, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "wmb-hero-hover":
          "0 24px 76px rgba(4, 120, 87, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.10)",
      },
      backgroundImage: {
        "wmb-hero":
          "linear-gradient(115deg, #064e3b 0%, #067a5f 48%, #0f766e 100%)",
        "wmb-hero-depth":
          "radial-gradient(circle at 82% 18%, rgba(45, 212, 191, 0.22), transparent 34%), radial-gradient(circle at 10% 92%, rgba(16, 185, 129, 0.18), transparent 30%), linear-gradient(115deg, #064e3b 0%, #067a5f 48%, #0f766e 100%)",
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