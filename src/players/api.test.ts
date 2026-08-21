import { describe, expect, it, vi } from "vitest";
import {
  claimPlayer,
  createPlayer,
  deletePlayer,
  getHoleBreakdown,
  getPlayerLayouts,
  getPlayerStats,
  getRecentCourses,
  getScoreDistribution,
  listPlayers,
  updatePlayer,
} from "./api";
import {
  holeBreakdownSchema,
  holeStatSchema,
  playedLayoutSchema,
  playerSchema,
  scoreDistributionSchema,
} from "../../shared/contracts/players";
import type {
  HoleBreakdown,
  HoleStat,
  PlayedLayout,
  Player,
  ScoreDistribution,
} from "../../shared/contracts/players";

function aPlayer(overrides: Partial<Player> = {}): Player {
  return playerSchema.parse({
    id: 1,
    name: "Alice",
    createdAt: "",
    roundCount: 0,
    claimedByUserId: null,
    ...overrides,
  });
}

function aPlayedLayout(overrides: Partial<PlayedLayout> = {}): PlayedLayout {
  return playedLayoutSchema.parse({
    courseId: 1,
    courseName: "Maple Hill",
    layoutId: 2,
    layoutName: "Blue",
    ...overrides,
  });
}

function aHoleStat(overrides: Partial<HoleStat> = {}): HoleStat {
  return holeStatSchema.parse({
    holeId: 10,
    number: 1,
    par: 3,
    timesPlayed: 2,
    avgStrokes: 3.5,
    bestStrokes: 3,
    worstStrokes: 4,
    avgPenalties: 0,
    ...overrides,
  });
}

function aScoreDistribution(
  overrides: Partial<ScoreDistribution> = {},
): ScoreDistribution {
  return scoreDistributionSchema.parse({
    ace: 0,
    albatross: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleBogey: 0,
    worse: 0,
    ...overrides,
  });
}

function aHoleBreakdown(overrides: Partial<HoleBreakdown> = {}): HoleBreakdown {
  return holeBreakdownSchema.parse({
    hole: {
      id: 10,
      number: 1,
      par: 3,
      distanceMeters: 90,
      layoutId: 2,
      layoutName: "Blue",
      courseName: "Maple Hill",
    },
    distribution: {
      ace: 0,
      albatross: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      doubleBogey: 0,
      worse: 0,
    },
    throws: [],
    playerAvgStrokes: null,
    allPlayersAvgStrokes: null,
    ...overrides,
  });
}

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
    const fetchMock = mockFetchOnce(aPlayer({ id: 1, name: "Alice" }));
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
    const fetchMock = mockFetchOnce(aPlayer({ id: 1, name: "Jon" }));
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
      players: [aPlayer({ id: 1, name: "Alice" })],
    });
    const { players } = await listPlayers();
    expect(players).toEqual([aPlayer({ id: 1, name: "Alice" })]);
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
      layouts: [aPlayedLayout()],
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
      recentCourses: [aPlayedLayout()],
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
      holes: [aHoleStat()],
    });
    const { holes } = await getPlayerStats(1, 2);
    expect(holes).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/stats?layoutId=2",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("gets a player's overall score distribution", async () => {
    const fetchMock = mockFetchOnce({
      distribution: aScoreDistribution({ birdie: 3, par: 10 }),
    });
    const { distribution } = await getScoreDistribution(1);
    expect(distribution).toEqual(aScoreDistribution({ birdie: 3, par: 10 }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/score-distribution",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("gets a hole breakdown for a player", async () => {
    const fetchMock = mockFetchOnce({
      breakdown: aHoleBreakdown({ playerAvgStrokes: 2.5 }),
    });
    const { breakdown } = await getHoleBreakdown(1, 10);
    expect(breakdown).toEqual(aHoleBreakdown({ playerAvgStrokes: 2.5 }));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/holes/10/breakdown",
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
    const fetchMock = mockFetchOnce(
      aPlayer({ id: 1, name: "Alice", claimedByUserId: 5 }),
    );
    await claimPlayer(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/players/1/claim",
      expect.objectContaining({ method: "POST", body: JSON.stringify({}) }),
    );
  });
});
