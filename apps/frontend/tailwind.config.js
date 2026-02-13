/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#A2DED0",
        "bg-light": "#F8FAFB",
        "text-primary": "#1E293B",
        "text-secondary": "#64748B",
        "text-muted": "#78716C",
        "text-subtle": "#78716C",
        "bg-dark": "#0F1719",
      },
    },
  },
  plugins: [],
};
