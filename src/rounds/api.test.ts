import { describe, expect, it, vi } from "vitest";
import {
  createPlayer,
  createRound,
  getRound,
  listPlayers,
  listRounds,
  updateHoleScore,
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
  it("creates a player", async () => {
    const fetchMock = mockFetchOnce({ id: 1, name: "Alice", createdAt: "" });
    await createPlayer("Alice");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Alice" }),
      }),
    );
  });

  it("lists players", async () => {
    mockFetchOnce({ players: [{ id: 1, name: "Alice", createdAt: "" }] });
    const { players } = await listPlayers();
    expect(players).toEqual([{ id: 1, name: "Alice", createdAt: "" }]);
  });

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

  it("lists rounds", async () => {
    mockFetchOnce({ rounds: [{ id: 1, courseName: "Maple Hill" }] });
    const { rounds } = await listRounds();
    expect(rounds).toEqual([{ id: 1, courseName: "Maple Hill" }]);
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
});
