import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/app/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "maskable-icon.png"],
      manifest: {
        name: "e-Izvestaj",
        short_name: "e-Izvestaj",
        description: "Digitalni evropski izvestaj o saobracajnoj nezgodi.",
        theme_color: "#0B0D12",
        background_color: "#0B0D12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/app/",
        scope: "/app/",
        icons: [
          {
            src: "logo.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "maskable-icon.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      }
    })
  ]
});
