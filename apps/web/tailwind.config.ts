import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211c",
        "ink-soft": "#5c665f",
        paper: "#f4f1ea",
        cream: "#fbfaf7",
        copper: "#d4532b",
        "copper-deep": "#a33a1c",
        sage: "#234237",
        sand: "#e3dcd0",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 18px 50px -28px rgba(26, 22, 20, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
