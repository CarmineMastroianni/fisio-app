import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sand: {
          50: "#f8f4ef",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
