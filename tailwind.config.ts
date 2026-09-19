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
        "bg-base": "#0B0C10",
        "bg-surface": "#13151D",
        "bg-surface-alt": "#1A1D27",
        "border-subtle": "#242835",
        "border-strong": "#353A4D",
        "text-primary": "#FFFFFF",
        "text-secondary": "#94A3B8",
        "text-muted": "#64748B",
        "brand-yellow": "#F5BA13",
        "brand-magenta": "#E11D48",
        "brand-cyan": "#0EA5E9",
        "brand-indigo": "#4F46E5",
        "brand-orange": "#EA580C",
        // Category tile background colors
        "cat-teal": "#0D9488",
        "cat-coral": "#E11D48",
        "cat-blue": "#2563EB",
        "cat-purple": "#6366F1",
        "cat-pink": "#DB2777",
        "cat-orange": "#D97706",
        brand: {
          dark: "#0B0C10",
          surface: "#13151D",
          yellow: "#F5BA13",
          magenta: "#E11D48",
          cyan: "#0EA5E9",
          indigo: "#4F46E5",
          orange: "#EA580C",
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
        "glow-magenta": "0 4px 20px -2px rgba(225, 29, 72, 0.15)",
        "glow-yellow": "0 4px 20px -2px rgba(245, 186, 19, 0.15)",
        "glow-cyan": "0 4px 20px -2px rgba(14, 165, 233, 0.15)",
        "elevation-sm": "0 2px 8px -1px rgba(0, 0, 0, 0.5)",
        "elevation-md": "0 12px 32px -4px rgba(0, 0, 0, 0.6)",
      },
    },
  },
  plugins: [],
};

export default config;
