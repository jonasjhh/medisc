import { describe, expect, it, vi } from "vitest";
import {
  createPlayer,
  getPlayerLayouts,
  getPlayerStats,
  listPlayers,
  updatePlayer,
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

describe("players api", () => {
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

  it("renames a player", async () => {
    const fetchMock = mockFetchOnce({ id: 1, name: "Jon", createdAt: "" });
    await updatePlayer(1, "Jon");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Jon" }),
      }),
    );
  });

  it("lists players", async () => {
    mockFetchOnce({ players: [{ id: 1, name: "Alice", createdAt: "" }] });
    const { players } = await listPlayers();
    expect(players).toEqual([{ id: 1, name: "Alice", createdAt: "" }]);
  });

  it("gets the layouts a player has played", async () => {
    const fetchMock = mockFetchOnce({
      layouts: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 2,
          layoutName: "Blue",
        },
      ],
    });
    const { layouts } = await getPlayerLayouts(1);
    expect(layouts).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/players/1/layouts", undefined);
  });

  it("gets a player's hole stats for a layout", async () => {
    const fetchMock = mockFetchOnce({
      holes: [{ holeId: 10, number: 1, par: 3, timesPlayed: 2 }],
    });
    const { holes } = await getPlayerStats(1, 2);
    expect(holes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/stats?layoutId=2",
      undefined,
    );
  });
});
