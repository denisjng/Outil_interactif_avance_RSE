import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fond: "#F3F4F1",
        encre: "#15201B",
        secondaire: "#4A5550",
        filet: "#D9DDD7",
        energie: "#B45309",
        carbone: "#334155",
        eau: "#1D4ED8",
        gain: "#14532D",
      },
      fontFamily: {
        titre: ["'Space Grotesk'", "system-ui", "sans-serif"],
        texte: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        chiffre: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
