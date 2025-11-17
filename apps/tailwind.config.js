module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        "primary-hover": "var(--primary-hover)",
        "primary-active": "var(--primary-active)",
        ring: "var(--ring)",
        muted: "var(--muted)",
      },
      ringColor: { DEFAULT: "var(--ring)" },
    },
  },
  plugins: [],
};
