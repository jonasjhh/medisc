import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";
import { seedCourse } from "../test/seed";

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return app.request(path, init, env);
}

function setUpCourseWithTwoHoles() {
  return seedCourse(env, {
    courseName: "Maple Hill",
    layoutName: "Blue",
    holes: [
      { number: 1, par: 3, distanceMeters: 90 },
      { number: 2, par: 4, distanceMeters: 120 },
    ],
  });
}

async function createPlayer(name: string) {
  const player = await json<{ id: number; name: string }>(
    await request("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    }),
  );
  return player;
}

describe("rounds API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM players");
  });

  it("creates a round pre-seeded with par scores for every player and hole", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");

    const res = await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId,
        layoutId,
        playerIds: [alice.id, bob.id],
      }),
    });
    expect(res.status).toBe(201);
    const round = await json<{
      course: { name: string };
      layout: { name: string };
      counting: boolean;
      holes: Array<{ id: number; number: number; par: number }>;
      players: Array<{ id: number; name: string }>;
      scores: Array<{
        holeId: number;
        playerId: number;
        strokes: number;
        penalties: number;
      }>;
    }>(res);

    expect(round.course.name).toBe("Maple Hill");
    expect(round.layout.name).toBe("Blue");
    expect(round.counting).toBe(true);
    expect(round.holes).toHaveLength(2);
    expect(round.players.map((p) => p.name).sort()).toEqual(["Alice", "Bob"]);
    expect(round.scores).toHaveLength(4); // 2 players x 2 holes

    const hole1 = round.holes.find((h) => h.number === 1)!;
    const aliceHole1 = round.scores.find(
      (s) => s.holeId === hole1.id && s.playerId === alice.id,
    )!;
    expect(aliceHole1).toMatchObject({ strokes: 3, penalties: 0 });
  });

  it("404s when the layout doesn't belong to the course", async () => {
    const { layoutId } = await setUpCourseWithTwoHoles();
    const { courseId: otherCourseId } = await seedCourse(env, {
      courseName: "Other Course",
      holes: [],
    });
    const alice = await createPlayer("Alice");

    const res = await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: otherCourseId,
        layoutId,
        playerIds: [alice.id],
      }),
    });
    expect(res.status).toBe(404);
  });

  it("404s when a player doesn't exist", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();

    const res = await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [999] }),
    });
    expect(res.status).toBe(404);
  });

  it("lists rounds with player counts", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
    });

    const res = await request("/api/rounds");
    const { rounds } = await json<{
      rounds: Array<{ courseName: string; playerCount: number }>;
    }>(res);
    expect(rounds).toHaveLength(1);
    expect(rounds[0]).toMatchObject({
      courseName: "Maple Hill",
      playerCount: 1,
    });
  });

  it("404s when fetching a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999");
    expect(res.status).toBe(404);
  });

  it("finishes a round, setting completedAt", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const created = await json<{ id: number; completedAt: string | null }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );
    expect(created.completedAt).toBeNull();

    const res = await request(`/api/rounds/${created.id}/complete`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const completed = await json<{ completedAt: string | null }>(res);
    expect(completed.completedAt).not.toBeNull();
  });

  it("404s when finishing a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999/complete", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("filters the rounds list by status, player, and course", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const { courseId: otherCourseId } = await seedCourse(env, {
      courseName: "Other Course",
      holes: [],
    });
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");

    const roundA = await json<{ id: number }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );
    await request(`/api/rounds/${roundA.id}/complete`, { method: "POST" });

    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [bob.id] }),
    });

    const completedRes = await json<{ rounds: unknown[] }>(
      await request("/api/rounds?status=completed"),
    );
    expect(completedRes.rounds).toHaveLength(1);

    const inProgressRes = await json<{ rounds: unknown[] }>(
      await request("/api/rounds?status=in_progress"),
    );
    expect(inProgressRes.rounds).toHaveLength(1);

    const aliceRes = await json<{ rounds: unknown[] }>(
      await request(`/api/rounds?playerId=${alice.id}`),
    );
    expect(aliceRes.rounds).toHaveLength(1);

    const otherCourseRes = await json<{ rounds: unknown[] }>(
      await request(`/api/rounds?courseId=${otherCourseId}`),
    );
    expect(otherCourseRes.rounds).toHaveLength(0);
  });

  it("swaps which players are in an in-progress round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");
    const round = await json<{ id: number }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerIds: [bob.id] }),
    });
    expect(res.status).toBe(200);
    const updated = await json<{
      players: Array<{ id: number; name: string }>;
      scores: Array<{ playerId: number }>;
    }>(res);
    expect(updated.players).toEqual([{ id: bob.id, name: "Bob" }]);
    expect(updated.scores.every((score) => score.playerId === bob.id)).toBe(
      true,
    );
    expect(updated.scores).toHaveLength(2); // 2 holes x 1 player
  });

  it("409s when swapping players on a completed round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");
    const round = await json<{ id: number }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerIds: [bob.id] }),
    });
    expect(res.status).toBe(409);
  });

  it("toggles the counting flag, even on a completed round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const round = await json<{ id: number }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ counting: false }),
    });
    expect(res.status).toBe(200);
    const updated = await json<{ counting: boolean }>(res);
    expect(updated.counting).toBe(false);
  });

  it("404s when swapping players on a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ counting: false }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects a PATCH body with neither field", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const round = await json<{ id: number }>(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
    );

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
