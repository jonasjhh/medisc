import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import type { ZodTypeAny, z } from "zod";
import app from "../index";
import { seedCourse, seedUser } from "../test/seed";
import {
  playedLayoutsResponseSchema,
  playerListResponseSchema,
  playerSchema,
  recentCoursesResponseSchema,
  holeStatsResponseSchema,
  scoreDistributionResponseSchema,
} from "../../shared/contracts/players";
import { roundDetailSchema } from "../../shared/contracts/rounds";

async function json<S extends ZodTypeAny>(
  response: Response,
  schema: S,
): Promise<z.infer<S>> {
  return schema.parse(await response.json());
}

async function errorOf(response: Response): Promise<{ error: string }> {
  return (await response.json()) as { error: string };
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return app.request(path, init, env);
}

describe("players API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM device_link_codes");
    await env.DB.exec("DELETE FROM device_tokens");
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM users");
  });

  it("creates and lists players", async () => {
    const createRes = await request("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jonas" }),
    });
    expect(createRes.status).toBe(201);
    const created = await json(createRes, playerSchema);
    expect(created).toMatchObject({
      name: "Jonas",
      roundCount: 0,
      claimedByUserId: null,
    });

    const listRes = await request("/api/players");
    const { players } = await json(listRes, playerListResponseSchema);
    expect(players).toEqual([
      {
        id: created.id,
        name: "Jonas",
        createdAt: created.createdAt,
        roundCount: 0,
        claimedByUserId: null,
      },
    ]);
  });

  it("rejects an empty name", async () => {
    const res = await request("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("renames a player", async () => {
    const created = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
      playerSchema,
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jon" }),
    });
    expect(res.status).toBe(200);
    const updated = await json(res, playerSchema);
    expect(updated).toMatchObject({ id: created.id, name: "Jon" });

    const listRes = await request("/api/players");
    const { players } = await json(listRes, playerListResponseSchema);
    expect(players[0].name).toBe("Jon");
  });

  it("404s when renaming a player that doesn't exist", async () => {
    const res = await request("/api/players/999", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jon" }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects an empty name on rename", async () => {
    const created = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
      playerSchema,
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("deletes a player with no recorded rounds", async () => {
    const created = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
      playerSchema,
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);

    const { players } = await json(
      await request("/api/players"),
      playerListResponseSchema,
    );
    expect(players).toHaveLength(0);
  });

  it("404s when deleting a player that doesn't exist", async () => {
    const res = await request("/api/players/999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("refuses to delete a player with recorded rounds", async () => {
    const { courseId, layoutId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 3 }],
    });
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [player.id] }),
    });

    const listRes = await json(
      await request("/api/players"),
      playerListResponseSchema,
    );
    expect(listRes.players[0].roundCount).toBe(1);

    const res = await request(`/api/players/${player.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(409);
  });

  it("refuses to delete a claimed player even with zero recorded rounds", async () => {
    const { userId, deviceToken } = await seedUser(env);
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );
    const claimRes = await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });
    expect(claimRes.status).toBe(200);
    expect((await json(claimRes, playerSchema)).claimedByUserId).toBe(userId);

    const res = await request(`/api/players/${player.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(409);
    expect((await errorOf(res)).error).toBe("Cannot delete a claimed player");
  });
});

describe("claiming players", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM device_link_codes");
    await env.DB.exec("DELETE FROM device_tokens");
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM users");
  });

  async function createPlayer(name: string) {
    return json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      }),
      playerSchema,
    );
  }

  it("401s claiming without a resolved device identity", async () => {
    const player = await createPlayer("Alice");
    const res = await request(`/api/players/${player.id}/claim`, {
      method: "POST",
    });
    expect(res.status).toBe(401);
  });

  it("404s claiming a player that doesn't exist", async () => {
    const { deviceToken } = await seedUser(env);
    const res = await request("/api/players/999/claim", {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });
    expect(res.status).toBe(404);
  });

  it("claims an unclaimed player and reflects it on the list", async () => {
    const { userId, deviceToken } = await seedUser(env);
    const player = await createPlayer("Alice");

    const res = await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });
    expect(res.status).toBe(200);
    expect(await json(res, playerSchema)).toMatchObject({
      id: player.id,
      claimedByUserId: userId,
    });

    const { players } = await json(
      await request("/api/players"),
      playerListResponseSchema,
    );
    expect(players[0].claimedByUserId).toBe(userId);
  });

  it("409s claiming a player that's already claimed", async () => {
    const { deviceToken: tokenA } = await seedUser(env);
    const { deviceToken: tokenB } = await seedUser(env);
    const player = await createPlayer("Alice");

    await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": tokenA },
    });

    const res = await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": tokenB },
    });
    expect(res.status).toBe(409);
  });

  it("409s claiming a second player once you already have one", async () => {
    const { deviceToken } = await seedUser(env);
    const first = await createPlayer("Alice");
    const second = await createPlayer("Bob");

    await request(`/api/players/${first.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });

    const res = await request(`/api/players/${second.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });
    expect(res.status).toBe(409);
  });

  it("filters the unclaimed player list", async () => {
    const { deviceToken } = await seedUser(env);
    const claimed = await createPlayer("Alice");
    const unclaimed = await createPlayer("Bob");
    await request(`/api/players/${claimed.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });

    const { players } = await json(
      await request("/api/players?unclaimed=true"),
      playerListResponseSchema,
    );
    expect(players.map((p) => p.id)).toEqual([unclaimed.id]);
  });

  it("lets anyone rename an unclaimed player", async () => {
    const player = await createPlayer("Alice");
    const res = await request(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ally" }),
    });
    expect(res.status).toBe(200);
  });

  it("lets the claiming user rename their claimed player", async () => {
    const { deviceToken } = await seedUser(env);
    const player = await createPlayer("Alice");
    await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });

    const res = await request(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "X-Device-Token": deviceToken,
      },
      body: JSON.stringify({ name: "Ally" }),
    });
    expect(res.status).toBe(200);
    expect((await json(res, playerSchema)).name).toBe("Ally");
  });

  it("403s renaming a claimed player as a different user", async () => {
    const { deviceToken: ownerToken } = await seedUser(env);
    const { deviceToken: otherToken } = await seedUser(env);
    const player = await createPlayer("Alice");
    await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": ownerToken },
    });

    const res = await request(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "X-Device-Token": otherToken,
      },
      body: JSON.stringify({ name: "Ally" }),
    });
    expect(res.status).toBe(403);
    expect((await errorOf(res)).error).toBe(
      "Only the player who claimed this profile can edit it",
    );
  });

  it("403s renaming a claimed player with no device identity at all", async () => {
    const { deviceToken } = await seedUser(env);
    const player = await createPlayer("Alice");
    await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });

    const res = await request(`/api/players/${player.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Ally" }),
    });
    expect(res.status).toBe(403);
  });
});

describe("player stats", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM device_link_codes");
    await env.DB.exec("DELETE FROM device_tokens");
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM users");
  });

  function setUpCourseWithOneHole() {
    return seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 3 }],
    });
  }

  async function playRound(
    courseId: number,
    layoutId: number,
    playerId: number,
    strokes: number,
    options?: { counting?: boolean },
  ) {
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [playerId] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/hole-scores/${round.scores[0].id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes }),
    });
    if (options?.counting === false) {
      await request(`/api/rounds/${round.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ counting: false }),
      });
    }
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });
  }

  it("lists the layouts a player has completed rounds on", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    expect(
      (
        await json(
          await request(`/api/players/${player.id}/layouts`),
          playedLayoutsResponseSchema,
        )
      ).layouts,
    ).toHaveLength(0);

    await playRound(courseId, layoutId, player.id, 4);

    const { layouts } = await json(
      await request(`/api/players/${player.id}/layouts`),
      playedLayoutsResponseSchema,
    );
    expect(layouts).toEqual([
      { courseId, courseName: "Maple Hill", layoutId, layoutName: "Blue" },
    ]);
  });

  it("aggregates hole stats across completed rounds only", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    await playRound(courseId, layoutId, player.id, 4);
    await playRound(courseId, layoutId, player.id, 2);
    // An in-progress (not completed) round shouldn't count towards stats.
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [player.id] }),
    });

    const { holes } = await json(
      await request(`/api/players/${player.id}/stats?layoutId=${layoutId}`),
      holeStatsResponseSchema,
    );

    expect(holes).toEqual([
      {
        number: 1,
        timesPlayed: 2,
        avgStrokes: 3,
        bestStrokes: 2,
        worstStrokes: 4,
        avgPenalties: 0,
        holeId: expect.any(Number),
        par: 3,
      },
    ]);
  });

  it("excludes non-counting rounds from both stats and the layouts list", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    await playRound(courseId, layoutId, player.id, 4, { counting: false });

    const { layouts } = await json(
      await request(`/api/players/${player.id}/layouts`),
      playedLayoutsResponseSchema,
    );
    expect(layouts).toHaveLength(0);

    const { holes } = await json(
      await request(`/api/players/${player.id}/stats?layoutId=${layoutId}`),
      holeStatsResponseSchema,
    );
    expect(holes).toHaveLength(0);
  });

  it("returns the 3 most recently played courses, most recent first", async () => {
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    const courseA = await setUpCourseWithOneHole();
    const courseB = await seedCourse(env, {
      courseName: "Pine Ridge",
      layoutName: "Red",
      holes: [{ number: 1, par: 3 }],
    });
    const courseC = await seedCourse(env, {
      courseName: "Oak Grove",
      layoutName: "Gold",
      holes: [{ number: 1, par: 3 }],
    });
    const courseD = await seedCourse(env, {
      courseName: "Cedar Park",
      layoutName: "White",
      holes: [{ number: 1, par: 3 }],
    });

    // Played in this order: A (oldest), B, C, D (most recent).
    await playRound(courseA.courseId, courseA.layoutId, player.id, 3);
    await playRound(courseB.courseId, courseB.layoutId, player.id, 3);
    await playRound(courseC.courseId, courseC.layoutId, player.id, 3);
    await playRound(courseD.courseId, courseD.layoutId, player.id, 3);

    const { recentCourses } = await json(
      await request(`/api/players/${player.id}/recent-courses`),
      recentCoursesResponseSchema,
    );

    expect(recentCourses).toEqual([
      {
        courseId: courseD.courseId,
        courseName: "Cedar Park",
        layoutId: courseD.layoutId,
        layoutName: "White",
      },
      {
        courseId: courseC.courseId,
        courseName: "Oak Grove",
        layoutId: courseC.layoutId,
        layoutName: "Gold",
      },
      {
        courseId: courseB.courseId,
        courseName: "Pine Ridge",
        layoutId: courseB.layoutId,
        layoutName: "Red",
      },
    ]);
  });

  it("dedupes repeated rounds on the same course/layout into one recent entry", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    await playRound(courseId, layoutId, player.id, 3);
    await playRound(courseId, layoutId, player.id, 4);

    const { recentCourses } = await json(
      await request(`/api/players/${player.id}/recent-courses`),
      recentCoursesResponseSchema,
    );
    expect(recentCourses).toHaveLength(1);
  });

  it("includes in-progress and non-counting rounds in recent courses", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    // Neither completed nor marked counting — still a course the player
    // recently started a round on, which is what this shortcut is for.
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [player.id] }),
    });

    const { recentCourses } = await json(
      await request(`/api/players/${player.id}/recent-courses`),
      recentCoursesResponseSchema,
    );
    expect(recentCourses).toHaveLength(1);
  });

  it("returns an empty list for a player with no rounds", async () => {
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );

    const { recentCourses } = await json(
      await request(`/api/players/${player.id}/recent-courses`),
      recentCoursesResponseSchema,
    );
    expect(recentCourses).toEqual([]);
  });

  it("404s for a player that doesn't exist", async () => {
    const res = await request("/api/players/999/layouts");
    expect(res.status).toBe(404);
  });

  it("404s fetching recent courses for a player that doesn't exist", async () => {
    const res = await request("/api/players/999/recent-courses");
    expect(res.status).toBe(404);
  });

  it("requires a layoutId for stats", async () => {
    const player = await json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
      playerSchema,
    );
    const res = await request(`/api/players/${player.id}/stats`);
    expect(res.status).toBe(400);
  });
});

describe("player score distribution", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM device_link_codes");
    await env.DB.exec("DELETE FROM device_tokens");
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM users");
  });

  async function createPlayer(name: string) {
    return json(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      }),
      playerSchema,
    );
  }

  // Plays a round setting each hole's strokes by hole number, then completes
  // it. Holes need varying par so every bucket (especially eagle, which is
  // unreachable on a par-3) can be exercised.
  async function playRoundWithStrokes(
    courseId: number,
    layoutId: number,
    playerId: number,
    strokesByHoleNumber: Record<number, number>,
    options?: { counting?: boolean; complete?: boolean },
  ) {
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [playerId] }),
      }),
      roundDetailSchema,
    );
    for (const hole of round.holes) {
      const strokes = strokesByHoleNumber[hole.number];
      if (strokes === undefined) continue;
      const score = round.scores.find((s) => s.holeId === hole.id)!;
      await request(`/api/hole-scores/${score.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ strokes }),
      });
    }
    if (options?.counting === false) {
      await request(`/api/rounds/${round.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ counting: false }),
      });
    }
    if (options?.complete !== false) {
      await request(`/api/rounds/${round.id}/complete`, { method: "POST" });
    }
    return round;
  }

  it("buckets every counting throw across all of a player's rounds", async () => {
    const { courseId, layoutId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [
        { number: 1, par: 5 }, // albatross: strokes = 2
        { number: 2, par: 5 }, // eagle: strokes = 3
        { number: 3, par: 3 }, // ace: strokes = 1
        { number: 4, par: 3 }, // birdie: strokes = 2
        { number: 5, par: 3 }, // par: strokes = 3
        { number: 6, par: 3 }, // bogey: strokes = 4
        { number: 7, par: 3 }, // double bogey: strokes = 5
        { number: 8, par: 3 }, // worse: strokes = 6
      ],
    });
    const player = await createPlayer("Alice");

    await playRoundWithStrokes(courseId, layoutId, player.id, {
      1: 2,
      2: 3,
      3: 1,
      4: 2,
      5: 3,
      6: 4,
      7: 5,
      8: 6,
    });

    const { distribution } = await json(
      await request(`/api/players/${player.id}/score-distribution`),
      scoreDistributionResponseSchema,
    );
    expect(distribution).toEqual({
      ace: 1,
      albatross: 1,
      eagle: 1,
      birdie: 1,
      par: 1,
      bogey: 1,
      doubleBogey: 1,
      worse: 1,
    });
  });

  it("an ace takes priority over albatross even on a hole where strokes = 1 would also qualify as albatross", async () => {
    const { courseId, layoutId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 5 }],
    });
    const player = await createPlayer("Alice");

    await playRoundWithStrokes(courseId, layoutId, player.id, { 1: 1 });

    const { distribution } = await json(
      await request(`/api/players/${player.id}/score-distribution`),
      scoreDistributionResponseSchema,
    );
    expect(distribution.ace).toBe(1);
    expect(distribution.albatross).toBe(0);
  });

  it("aggregates across every layout the player has played, not just one", async () => {
    const courseA = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 3 }],
    });
    const courseB = await seedCourse(env, {
      courseName: "Pine Ridge",
      layoutName: "Red",
      holes: [{ number: 1, par: 3 }],
    });
    const player = await createPlayer("Alice");

    await playRoundWithStrokes(courseA.courseId, courseA.layoutId, player.id, {
      1: 3,
    });
    await playRoundWithStrokes(courseB.courseId, courseB.layoutId, player.id, {
      1: 4,
    });

    const { distribution } = await json(
      await request(`/api/players/${player.id}/score-distribution`),
      scoreDistributionResponseSchema,
    );
    expect(distribution.par).toBe(1);
    expect(distribution.bogey).toBe(1);
  });

  it("excludes in-progress and non-counting rounds", async () => {
    const { courseId, layoutId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 3 }],
    });
    const player = await createPlayer("Alice");

    await playRoundWithStrokes(
      courseId,
      layoutId,
      player.id,
      { 1: 4 },
      { counting: false },
    );
    await playRoundWithStrokes(
      courseId,
      layoutId,
      player.id,
      { 1: 5 },
      { complete: false },
    );

    const { distribution } = await json(
      await request(`/api/players/${player.id}/score-distribution`),
      scoreDistributionResponseSchema,
    );
    expect(distribution).toEqual({
      ace: 0,
      albatross: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      doubleBogey: 0,
      worse: 0,
    });
  });

  it("returns a zero-filled distribution for a player with no rounds", async () => {
    const player = await createPlayer("Alice");

    const { distribution } = await json(
      await request(`/api/players/${player.id}/score-distribution`),
      scoreDistributionResponseSchema,
    );
    expect(distribution).toEqual({
      ace: 0,
      albatross: 0,
      eagle: 0,
      birdie: 0,
      par: 0,
      bogey: 0,
      doubleBogey: 0,
      worse: 0,
    });
  });

  it("404s for a player that doesn't exist", async () => {
    const res = await request("/api/players/999/score-distribution");
    expect(res.status).toBe(404);
  });
});
