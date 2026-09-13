import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#0B0E1A",     // page background (near-black navy)
          surface: "#141827",  // card/panel background
          yellow: "#F5C518",   // primary CTA, ratings, highlights
          magenta: "#E91E8C",  // gradient accent, promo banners
          cyan: "#22D3EE",     // secondary accent, some icons
  },
},
    },
  },
  plugins: [],
};

export default config;
