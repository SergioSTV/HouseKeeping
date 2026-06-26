import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Estos colores apuntan a variables CSS que cambian segun el hotel activo.
        hotel: {
          primary: "var(--hotel-primary)",
          secondary: "var(--hotel-secondary)",
          accent: "var(--hotel-accent)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
