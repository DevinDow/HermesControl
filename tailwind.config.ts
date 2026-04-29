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
        background: "var(--background)",
        foreground: "var(--foreground)",
        "primary-gold": "var(--primary-gold)",
        "accent-amber": "var(--accent-amber)",
        "body-cornsilk": "var(--body-cornsilk)",
        "dimmed-darkgoldenrod": "var(--dimmed-darkgoldenrod)",
        "notes-lightyellow": "var(--notes-lightyellow)",
      },
    },
  },
  plugins: [],
};
export default config;
