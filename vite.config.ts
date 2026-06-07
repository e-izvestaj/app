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
      workbox: {
        globIgnores: ["**/ort-wasm-*.wasm"],
        maximumFileSizeToCacheInBytes: 32 * 1024 * 1024,
        navigateFallbackDenylist: [/\.pdf$/]
      },
      manifest: {
        name: "e-Izveštaj",
        short_name: "e-Izveštaj",
        description: "Digitalni evropski izveštaj o saobraćajnoj nezgodi.",
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
