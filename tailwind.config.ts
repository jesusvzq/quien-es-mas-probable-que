import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "media",
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "#ff6b81",
          dark: "#e2536a",
        },
        secondary: {
          DEFAULT: "#7c6bff",
          dark: "#6152d9",
        },
        accent: {
          DEFAULT: "#ffd166",
        },
        surface: "var(--surface)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
      },
    },
  },
  plugins: [],
};
export default config;
