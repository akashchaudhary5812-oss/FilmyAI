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
          950: "#00061a", // Near-black navy base (deepest bg)
          900: "#01147C", // Disney+ Hotstar signature deep blue
          850: "#0C2575", // Disney+ alternate deep blue
          800: "#0A2885", // Jio Blue surface
          700: "#1a3a9f", // Lighter navy accent
          600: "#2a4fba", // Muted blue border
        },
        gold: {
          400: "#e6d200", // Bright accent yellow
          500: "#C8B700", // Hotstar accent yellow (primary)
          600: "#a89800", // Deep golden yellow
        },
        neural: {
          400: "#1aA090", // Light Hotstar teal
          500: "#136878", // Hotstar Teal (primary)
          600: "#0d4d5a", // Deep teal
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinematic-hero": "linear-gradient(to top, #00061a 10%, rgba(1, 20, 124, 0.85) 40%, rgba(12, 37, 117, 0.3) 80%, rgba(0, 6, 26, 0.95) 100%)",
        "gold-shimmer": "linear-gradient(90deg, transparent, rgba(200, 183, 0, 0.22), transparent)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2.5s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(200, 183, 0, 0.3)" },
          "100%": { boxShadow: "0 0 30px rgba(200, 183, 0, 0.65)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
