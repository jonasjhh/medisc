/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves project sites from /<repo-name>/, so the base path
// must match the repo name in production builds while staying "/" for dev.
const base = process.env.GITHUB_PAGES === "true" ? "/medisc/" : "/";

export default defineConfig({
  base,
  server: {
    // Forwards API calls to `wrangler dev` (run alongside `pnpm dev`) so the
    // frontend can talk to the Worker/D1 backend during local development.
    proxy: {
      "/api": "http://localhost:8787",
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        id: "/",
        name: "Medisc",
        short_name: "Medisc",
        description: "Medisc — installable progressive web app.",
        start_url: base,
        scope: base,
        display: "standalone",
        theme_color: "#6750a4",
        background_color: "#fffbfe",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "pwa-512x512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["e2e/**", "**/*.config.*", "src/main.tsx"],
    },
    exclude: ["e2e/**", "worker/**", "node_modules/**"],
  },
});
