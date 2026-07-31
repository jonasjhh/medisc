import { describe, expect, it, vi } from "vitest";
import {
  claimPlayer,
  createPlayer,
  deletePlayer,
  getPlayerLayouts,
  getPlayerStats,
  getRecentCourses,
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

function mockNoContentFetchOnce() {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 204,
    json: async () => {
      throw new Error("no body");
    },
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
    mockFetchOnce({
      players: [{ id: 1, name: "Alice", createdAt: "", claimedByUserId: null }],
    });
    const { players } = await listPlayers();
    expect(players).toEqual([
      { id: 1, name: "Alice", createdAt: "", claimedByUserId: null },
    ]);
  });

  it("lists only unclaimed players when requested", async () => {
    const fetchMock = mockFetchOnce({ players: [] });
    await listPlayers({ unclaimed: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players?unclaimed=true",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
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
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/layouts",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("gets a player's recent courses", async () => {
    const fetchMock = mockFetchOnce({
      recentCourses: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 2,
          layoutName: "Blue",
        },
      ],
    });
    const { recentCourses } = await getRecentCourses(1);
    expect(recentCourses).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/recent-courses",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("gets a player's hole stats for a layout", async () => {
    const fetchMock = mockFetchOnce({
      holes: [{ holeId: 10, number: 1, par: 3, timesPlayed: 2 }],
    });
    const { holes } = await getPlayerStats(1, 2);
    expect(holes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/stats?layoutId=2",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("deletes a player", async () => {
    const fetchMock = mockNoContentFetchOnce();
    await deletePlayer(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("claims a player", async () => {
    const fetchMock = mockFetchOnce({
      id: 1,
      name: "Alice",
      createdAt: "",
      roundCount: 0,
      claimedByUserId: 5,
    });
    await claimPlayer(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/claim",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });
});
