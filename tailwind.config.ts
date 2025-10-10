import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./index.html",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Body text
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Headings
        heading: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        accent: 'var(--accent)',
        border: 'var(--border)',
        ok: 'var(--ok)',
        err: 'var(--err)',
      },
      borderRadius: {
        xl: '14px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.04)',
      },
    },
  },
  plugins: [],
};

export default config;