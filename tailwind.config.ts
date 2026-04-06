import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#0f0f0f",
          secondary: "#1a1a1a",
          card: "#222222",
          hover: "#2a2a2a",
        },
        accent: {
          blue: "#3b82f6",
          "blue-hover": "#2563eb",
          red: "#ef4444",
        },
        text: {
          primary: "#f0f0f0",
          secondary: "#888888",
          muted: "#555555",
        },
        border: "#2a2a2a",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
