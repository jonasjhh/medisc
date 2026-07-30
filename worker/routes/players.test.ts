import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";
import { seedCourse } from "../test/seed";

interface PlayerResponse {
  id: number;
  name: string;
  createdAt: string;
  roundCount: number;
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
    await env.DB.exec("DELETE FROM players");
  });

  it("creates and lists players", async () => {
    const createRes = await request("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Jonas" }),
    });
    expect(createRes.status).toBe(201);
    const created = await json<PlayerResponse>(createRes);
    expect(created).toMatchObject({ name: "Jonas", roundCount: 0 });

    const listRes = await request("/api/players");
    const { players } = await json<{ players: PlayerResponse[] }>(listRes);
    expect(players).toEqual([
      {
        id: created.id,
        name: "Jonas",
        createdAt: created.createdAt,
        roundCount: 0,
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
});

describe("player stats", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM players");
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
