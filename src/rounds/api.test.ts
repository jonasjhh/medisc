import { describe, expect, it, vi } from "vitest";
import {
  completeRound,
  createRound,
  getRound,
  listRounds,
  reopenRound,
  updateHoleScore,
  updateRound,
} from "./api";

function mockFetchOnce(body: unknown, init: { ok?: boolean } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.ok === false ? 400 : 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("rounds api", () => {
  it("creates a round", async () => {
    const fetchMock = mockFetchOnce({
      id: 1,
      holes: [],
      players: [],
      scores: [],
    });
    await createRound({ courseId: 1, layoutId: 2, playerIds: [3, 4] });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rounds",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ courseId: 1, layoutId: 2, playerIds: [3, 4] }),
      }),
    );
  });

  it("lists rounds with no filters", async () => {
    const fetchMock = mockFetchOnce({
      rounds: [{ id: 1, courseName: "Maple Hill" }],
    });
    const { rounds } = await listRounds();
    expect(rounds).toEqual([{ id: 1, courseName: "Maple Hill" }]);
    expect(fetchMock).toHaveBeenCalledWith("/api/rounds", undefined);
  });

  it("lists rounds with filters as query params", async () => {
    const fetchMock = mockFetchOnce({ rounds: [] });
    await listRounds({ status: "completed", playerId: 5, courseId: 9 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rounds?status=completed&playerId=5&courseId=9",
      undefined,
    );
  });

  it("gets a round's detail", async () => {
    const fetchMock = mockFetchOnce({
      id: 1,
      holes: [],
      players: [],
      scores: [],
    });
    await getRound(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/rounds/1", undefined);
  });

  it("updates a hole score", async () => {
    const fetchMock = mockFetchOnce({ id: 10, strokes: 4, penalties: 0 });
    await updateHoleScore(10, { strokes: 4 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/hole-scores/10",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ strokes: 4 }),
      }),
    );
  });

  it("completes a round", async () => {
    const fetchMock = mockFetchOnce({ id: 1, completedAt: "2026-01-01" });
    await completeRound(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rounds/1/complete",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("reopens a round", async () => {
    const fetchMock = mockFetchOnce({ id: 1, completedAt: null });
    await reopenRound(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rounds/1/reopen",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("updates a round's players and counting flag", async () => {
    const fetchMock = mockFetchOnce({
      id: 1,
      holes: [],
      players: [],
      scores: [],
    });
    await updateRound(1, { playerIds: [2, 3], counting: false });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rounds/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ playerIds: [2, 3], counting: false }),
      }),
    );
  });
});
