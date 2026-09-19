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
          950: "#0B0F19", // Deep navy / blue-black primary background
          900: "#141A24", // Secondary background / card base
          850: "#192231", // Elevated dark surface
          800: "#1E2738", // Interactive surface
          700: "#252B36", // Dark cinematic borders
          600: "#323B4B", // Muted slate borders
        },
        netflix: {
          400: "#F40612", // Vibrant accent red
          500: "#E50914", // Netflix-inspired signature deep red
          600: "#B80710", // Deep cinematic red
        },
        prime: {
          400: "#1FB8EE", // Bright Prime Video cyan-blue
          500: "#00A8E1", // Prime Video-inspired signature blue
          600: "#0082B0", // Deep navy-blue accent
        },
        gold: {
          400: "#F40612", // Netflix red accent
          500: "#E50914", // Primary action red
          600: "#B80710", // Deep action red
        },
        neural: {
          400: "#1FB8EE", // Prime cyan-blue
          500: "#00A8E1", // Prime signature blue
          600: "#0082B0", // Prime deep blue
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "cinematic-hero":
          "linear-gradient(to top, #0B0F19 12%, rgba(20, 26, 36, 0.85) 50%, rgba(11, 15, 25, 0.45) 80%, rgba(11, 15, 25, 0.95) 100%)",
        "red-shimmer":
          "linear-gradient(90deg, transparent, rgba(229, 9, 20, 0.2), transparent)",
        "prime-shimmer":
          "linear-gradient(90deg, transparent, rgba(0, 168, 225, 0.2), transparent)",
        "cinematic-ambient":
          "radial-gradient(ellipse 80% 50% at 15% -5%, rgba(229, 9, 20, 0.07) 0%, transparent 60%), radial-gradient(ellipse 75% 50% at 85% 5%, rgba(0, 168, 225, 0.08) 0%, transparent 60%)",
      },
      animation: {
        "pulse-subtle": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        glow: "glow 2.5s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 15px rgba(229, 9, 20, 0.25)" },
          "100%": { boxShadow: "0 0 30px rgba(229, 9, 20, 0.55)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
