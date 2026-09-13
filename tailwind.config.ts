import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-base": "#0A0A0F",
        "bg-surface": "#15151F",
        "bg-surface-alt": "#1B1B27",
        "border-subtle": "#2A2A38",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A1A1AA",
        "text-muted": "#71717A",
        "brand-yellow": "#FFCF1B",
        "brand-magenta": "#F0179C",
        "brand-cyan": "#29C5F6",
        "brand-indigo": "#5B5FEF",
        "brand-orange": "#FF8A3D",
        // Category tile background colors
        "cat-teal": "#17C3C0",
        "cat-coral": "#F97066",
        "cat-blue": "#2E90FA",
        "cat-purple": "#7A5CF0",
        "cat-pink": "#EE4FA6",
        "cat-orange": "#F79A3E",
        brand: {
          dark: "#0A0A0F",
          surface: "#15151F",
          yellow: "#FFCF1B",
          magenta: "#F0179C",
          cyan: "#29C5F6",
          indigo: "#5B5FEF",
          orange: "#FF8A3D",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...defaultTheme.fontFamily.sans],
        display: ["var(--font-poppins)", ...defaultTheme.fontFamily.sans],
        script: ["var(--font-marker)", "cursive"],
      },
      borderRadius: {
        "2xl": "16px",
        "banner": "28px",
      },
      boxShadow: {
        "glow-magenta": "0 0 24px rgba(240, 23, 156, 0.25)",
        "glow-yellow": "0 0 24px rgba(255, 207, 27, 0.25)",
        "glow-cyan": "0 0 24px rgba(41, 197, 246, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
