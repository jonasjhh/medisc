import { describe, expect, it, vi } from "vitest";
import { fetchTopScores, recordVisit } from "./api";

describe("scores api", () => {
  it("posts a visit and returns the updated stats", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ totalVisits: 5, yourVisits: 2 }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const stats = await recordVisit("user-1");

    expect(stats).toEqual({ totalVisits: 5, yourVisits: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/scores",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ userId: "user-1", score: 1 }),
      }),
    );
  });

  it("throws when saving a visit fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(recordVisit("user-1")).rejects.toThrow(/500/);
  });

  it("fetches the top scores leaderboard", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        scores: [{ userId: "user-1", totalScore: 3, visits: 3 }],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const scores = await fetchTopScores(5);

    expect(scores).toEqual([{ userId: "user-1", totalScore: 3, visits: 3 }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/scores/top?limit=5");
  });

  it("throws when fetching the leaderboard fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );

    await expect(fetchTopScores()).rejects.toThrow(/503/);
  });
});
