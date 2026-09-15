import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        cinematic: {
          950: "#050608",
          900: "#090b10",
          850: "#0e1118",
          800: "#141722",
          700: "#1e2233",
          600: "#2b3047",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
        neural: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinematic-hero": "linear-gradient(to top, #090b10 10%, rgba(9, 11, 16, 0.8) 40%, rgba(9, 11, 16, 0.2) 80%, rgba(9, 11, 16, 0.9) 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.15), transparent)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2.5s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(245, 158, 11, 0.2)" },
          "100%": { boxShadow: "0 0 25px rgba(245, 158, 11, 0.5)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
