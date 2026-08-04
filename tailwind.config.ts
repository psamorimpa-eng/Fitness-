import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // anilhas olímpicas: base da identidade visual
        anilha: { p25: "#D62828", p20: "#1D4ED8", p15: "#F4C20D", p10: "#16A34A" },
        marca: { DEFAULT: "#E23A2E", escuro: "#C62B20", suave: "#3A1A17" },
        ferro: { 900: "#101216", 800: "#181B22", 700: "#20242D", 600: "#2C313C" },
      },
      fontFamily: {
        display: ["var(--fonte-display)", "Arial Narrow", "sans-serif"],
        corpo: ["var(--fonte-corpo)", "system-ui", "sans-serif"],
        mono: ["var(--fonte-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
