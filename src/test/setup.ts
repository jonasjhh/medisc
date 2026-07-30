import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, vi } from "vitest";

// vite-plugin-pwa's virtual module only exists at build time; stub it so
// components using useRegisterSW can be unit tested under jsdom.
vi.mock("virtual:pwa-register/react", () => ({
  useRegisterSW: () => ({
    offlineReady: [false, vi.fn()],
    needRefresh: [false, vi.fn()],
    updateServiceWorker: vi.fn(),
  }),
}));

// Default stub for the Worker API so components that call it (e.g.
// ScoreBoard) render without hitting the network; tests targeting the API
// itself override this per-test with a more specific fetch mock.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ totalVisits: 0, yourVisits: 0, scores: [] }),
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});
