import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import type { ZodTypeAny, z } from "zod";
import app from "../index";
import { seedCourse } from "../test/seed";
import {
  roundDetailSchema,
  roundListResponseSchema,
} from "../../shared/contracts/rounds";

async function json<S extends ZodTypeAny>(
  response: Response,
  schema: S,
): Promise<z.infer<S>> {
  return schema.parse(await response.json());
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
  const response = await request("/api/players", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const player = (await response.json()) as { id: number; name: string };
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
    const round = await json(res, roundDetailSchema);

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
    expect(aliceHole1).toMatchObject({
      strokes: 3,
      penalties: 0,
      recorded: false,
    });
  });

  it("returns the same round when POST is retried with the same Idempotency-Key", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const body = JSON.stringify({ courseId, layoutId, playerIds: [alice.id] });
    const headers = {
      "content-type": "application/json",
      "Idempotency-Key": "retry-key-1",
    };

    const first = await request("/api/rounds", {
      method: "POST",
      headers,
      body,
    });
    expect(first.status).toBe(201);
    const firstRound = await json(first, roundDetailSchema);

    const retry = await request("/api/rounds", {
      method: "POST",
      headers,
      body,
    });
    expect(retry.status).toBe(200);
    const retryRound = await json(retry, roundDetailSchema);
    expect(retryRound.id).toBe(firstRound.id);

    const { results: rounds } = await env.DB.prepare(
      "SELECT id FROM rounds",
    ).all();
    expect(rounds).toHaveLength(1);
  });

  it("creates separate rounds for different Idempotency-Key values", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const body = JSON.stringify({ courseId, layoutId, playerIds: [alice.id] });

    const first = await request("/api/rounds", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "key-a",
      },
      body,
    });
    const second = await request("/api/rounds", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "Idempotency-Key": "key-b",
      },
      body,
    });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);

    const firstRound = await json(first, roundDetailSchema);
    const secondRound = await json(second, roundDetailSchema);
    expect(firstRound.id).not.toBe(secondRound.id);
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
    const { rounds } = await json(res, roundListResponseSchema);
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
    const created = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    expect(created.completedAt).toBeNull();

    const res = await request(`/api/rounds/${created.id}/complete`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const completed = await json(res, roundDetailSchema);
    expect(completed.completedAt).not.toBeNull();
  });

  it("404s when finishing a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999/complete", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("reopens a completed round and allows editing scores again", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const created = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${created.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${created.id}/reopen`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const reopened = await json(res, roundDetailSchema);
    expect(reopened.completedAt).toBeNull();

    const scoreRes = await request(`/api/hole-scores/${created.scores[0].id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 5 }),
    });
    expect(scoreRes.status).toBe(200);
  });

  it("is a no-op reopening a round that's already in progress", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const created = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );

    const res = await request(`/api/rounds/${created.id}/reopen`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const reopened = await json(res, roundDetailSchema);
    expect(reopened.completedAt).toBeNull();
  });

  it("404s when reopening a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999/reopen", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("deletes a round along with its players and scores", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const created = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );

    const res = await request(`/api/rounds/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);

    const getRes = await request(`/api/rounds/${created.id}`);
    expect(getRes.status).toBe(404);

    const listRes = await json(
      await request("/api/rounds"),
      roundListResponseSchema,
    );
    expect(listRes.rounds).toHaveLength(0);
  });

  it("allows deleting a completed round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const created = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${created.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(204);
  });

  it("404s when deleting a round that doesn't exist", async () => {
    const res = await request("/api/rounds/999", { method: "DELETE" });
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

    const roundA = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${roundA.id}/complete`, { method: "POST" });

    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId, layoutId, playerIds: [bob.id] }),
    });

    const completedRes = await json(
      await request("/api/rounds?status=completed"),
      roundListResponseSchema,
    );
    expect(completedRes.rounds).toHaveLength(1);

    const inProgressRes = await json(
      await request("/api/rounds?status=in_progress"),
      roundListResponseSchema,
    );
    expect(inProgressRes.rounds).toHaveLength(1);

    const aliceRes = await json(
      await request(`/api/rounds?playerId=${alice.id}`),
      roundListResponseSchema,
    );
    expect(aliceRes.rounds).toHaveLength(1);

    const otherCourseRes = await json(
      await request(`/api/rounds?courseId=${otherCourseId}`),
      roundListResponseSchema,
    );
    expect(otherCourseRes.rounds).toHaveLength(0);
  });

  it("swaps which players are in an in-progress round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerIds: [bob.id] }),
    });
    expect(res.status).toBe(200);
    const updated = await json(res, roundDetailSchema);
    expect(updated.players).toEqual([{ id: bob.id, name: "Bob" }]);
    expect(updated.scores.every((score) => score.playerId === bob.id)).toBe(
      true,
    );
    expect(updated.scores).toHaveLength(2); // 2 holes x 1 player
    expect(updated.scores.every((score) => score.recorded === false)).toBe(
      true,
    );
  });

  it("409s when swapping players on a completed round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const bob = await createPlayer("Bob");
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ playerIds: [bob.id] }),
    });
    expect(res.status).toBe(409);
  });

  it("409s when toggling the counting flag on a completed round", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ counting: false }),
    });
    expect(res.status).toBe(409);
  });

  it("toggles the counting flag once a completed round is reopened", async () => {
    const { courseId, layoutId } = await setUpCourseWithTwoHoles();
    const alice = await createPlayer("Alice");
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );
    await request(`/api/rounds/${round.id}/complete`, { method: "POST" });
    await request(`/api/rounds/${round.id}/reopen`, { method: "POST" });

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ counting: false }),
    });
    expect(res.status).toBe(200);
    const updated = await json(res, roundDetailSchema);
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
    const round = await json(
      await request("/api/rounds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseId, layoutId, playerIds: [alice.id] }),
      }),
      roundDetailSchema,
    );

    const res = await request(`/api/rounds/${round.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
