import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#f6f7f9",
        ink: "#1d1d1f",
        muted: "#6e6e73",
        line: "#e5e7eb",
        accent: "#1677ff",
      },
      boxShadow: {
        subtle: "0 12px 36px rgba(29, 29, 31, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
