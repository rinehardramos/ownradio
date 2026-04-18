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
        "brand-pink": "#ff2d78",
        "brand-pink-light": "#ff6b9d",
        "brand-pink-bg": "#ffe0ec",
        "brand-dark": "#1a1a2e",
        "brand-dark-card": "#2d2d3f",
        "brand-dark-border": "#3d3d5c",
      },
      fontFamily: {
        mono: ["Courier New", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
