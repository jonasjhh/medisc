import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// vite-plugin-pwa's virtual module only exists at build time; stub it so
// components using useRegisterSW can be unit tested under jsdom.
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));
