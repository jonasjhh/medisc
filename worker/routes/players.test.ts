import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";
import { seedCourse, seedUser } from "../test/seed";

interface PlayerResponse {
  id: number;
  name: string;
  createdAt: string;
  roundCount: number;
  claimedByUserId: number | null;
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
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
    const created = await json<PlayerResponse>(createRes);
    expect(created).toMatchObject({
      name: "Jonas",
      roundCount: 0,
      claimedByUserId: null,
    });

    const listRes = await request("/api/players");
    const { players } = await json<{ players: PlayerResponse[] }>(listRes);
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
    const created = await json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jon" }),
    });
    expect(res.status).toBe(200);
    const updated = await json<PlayerResponse>(res);
    expect(updated).toMatchObject({ id: created.id, name: "Jon" });

    const listRes = await request("/api/players");
    const { players } = await json<{ players: PlayerResponse[] }>(listRes);
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
    const created = await json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    });
    expect(res.status).toBe(400);
  });

  it("deletes a player with no recorded rounds", async () => {
    const created = await json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      }),
    );

    const res = await request(`/api/players/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);

    const { players } = await json<{ players: PlayerResponse[] }>(
      await request("/api/players"),
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
    const player = await json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [player.id] }),
    });

    const listRes = await json<{ players: PlayerResponse[] }>(
      await request("/api/players"),
    );
    expect(listRes.players[0].roundCount).toBe(1);

    const res = await request(`/api/players/${player.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(409);
  });

  it("refuses to delete a claimed player even with zero recorded rounds", async () => {
    const { userId, deviceToken } = await seedUser(env);
    const player = await json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );
    const claimRes = await request(`/api/players/${player.id}/claim`, {
      method: "POST",
      headers: { "X-Device-Token": deviceToken },
    });
    expect(claimRes.status).toBe(200);
    expect((await json<PlayerResponse>(claimRes)).claimedByUserId).toBe(userId);

    const res = await request(`/api/players/${player.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(409);
    expect((await json<{ error: string }>(res)).error).toBe(
      "Cannot delete a claimed player",
    );
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
    return json<PlayerResponse>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name }),
      }),
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
    expect(await json<PlayerResponse>(res)).toMatchObject({
      id: player.id,
      claimedByUserId: userId,
    });

    const { players } = await json<{ players: PlayerResponse[] }>(
      await request("/api/players"),
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

    const { players } = await json<{ players: PlayerResponse[] }>(
      await request("/api/players?unclaimed=true"),
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
    expect((await json<PlayerResponse>(res)).name).toBe("Ally");
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
    expect((await json<{ error: string }>(res)).error).toBe(
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
    const round = await json<{
      id: number;
      scores: Array<{ id: number }>;
    }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [playerId] }),
      }),
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
    const player = await json<{ id: number }>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );

    expect(
      (
        await json<{ layouts: unknown[] }>(
          await request(`/api/players/${player.id}/layouts`),
        )
      ).layouts,
    ).toHaveLength(0);

    await playRound(courseId, layoutId, player.id, 4);

    const { layouts } = await json<{
      layouts: Array<{ courseName: string; layoutName: string }>;
    }>(await request(`/api/players/${player.id}/layouts`));
    expect(layouts).toEqual([
      { courseId, courseName: "Maple Hill", layoutId, layoutName: "Blue" },
    ]);
  });

  it("aggregates hole stats across completed rounds only", async () => {
    const { courseId, layoutId } = await setUpCourseWithOneHole();
    const player = await json<{ id: number }>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );

    await playRound(courseId, layoutId, player.id, 4);
    await playRound(courseId, layoutId, player.id, 2);
    // An in-progress (not completed) round shouldn't count towards stats.
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [player.id] }),
    });

    const { holes } = await json<{
      holes: Array<{
        number: number;
        timesPlayed: number;
        avgStrokes: number;
        bestStrokes: number;
        worstStrokes: number;
      }>;
    }>(await request(`/api/players/${player.id}/stats?layoutId=${layoutId}`));

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
    const player = await json<{ id: number }>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );

    await playRound(courseId, layoutId, player.id, 4, { counting: false });

    const { layouts } = await json<{ layouts: unknown[] }>(
      await request(`/api/players/${player.id}/layouts`),
    );
    expect(layouts).toHaveLength(0);

    const { holes } = await json<{ holes: unknown[] }>(
      await request(`/api/players/${player.id}/stats?layoutId=${layoutId}`),
    );
    expect(holes).toHaveLength(0);
  });

  it("404s for a player that doesn't exist", async () => {
    const res = await request("/api/players/999/layouts");
    expect(res.status).toBe(404);
  });

  it("requires a layoutId for stats", async () => {
    const player = await json<{ id: number }>(
      await request("/api/players", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }),
    );
    const res = await request(`/api/players/${player.id}/stats`);
    expect(res.status).toBe(400);
  });
});
