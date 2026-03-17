import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1D6FA4",
        "primary-hover": "#1a5f8e",
        secondary: "#27AE60",
        warning: "#F39C12",
        danger: "#E74C3C",
        background: "#F4F6F9",
        card: "#FFFFFF",
        "text-primary": "#2C3E50",
        "text-secondary": "#7F8C8D",
        border: "#E0E6ED",
      },
      fontFamily: {
        cairo: ["Cairo", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
