import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["icons/app-icon.svg", "icons/app-icon-maskable.svg"],
      manifest: {
        name: "Fisio App",
        short_name: "Fisio",
        description: "Agenda e gestione visite per fisioterapista domiciliare.",
        start_url: "/",
        display: "standalone",
        background_color: "#fff7ed",
        theme_color: "#0f766e",
        lang: "it",
        icons: [
          {
            src: "icons/app-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any",
          },
          {
            src: "icons/app-icon-maskable.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
});
