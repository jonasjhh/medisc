/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
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
        start_url: "/",
        scope: "/",
        display: "standalone",
        theme_color: "#2e6e4e",
        background_color: "#f6f7f5",
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
    // formatDateTime() renders in the local timezone by design; pin the
    // test runner's zone to UTC so assertions matching UTC timestamps
    // don't depend on wherever the repo happens to be cloned.
    env: { TZ: "UTC" },
    setupFiles: ["./src/test/setup.ts"],
    css: true,
    // Without this, vi.fn() call history survives across tests in the same
    // file (RTL's automatic unmount doesn't reset mocks), so assertions like
    // "not called" or exact call counts are only reliable if nothing earlier
    // in the file touched the same mock.
    clearMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: ["e2e/**", "**/*.config.*", "src/main.tsx"],
    },
    exclude: ["e2e/**", "worker/**", "node_modules/**"],
  },
});
