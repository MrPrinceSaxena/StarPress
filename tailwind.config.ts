import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette from docs/00-PROJECT-OVERVIEW.md
        brand: {
          navy: "#0A1F44",   // Primary — Navy Blue / Dark Blue
          gold: "#F5B301",   // Accent — Yellow / Gold
        },
      },
    },
  },
  plugins: [],
};

export default config;
