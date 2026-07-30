import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return app.request(path, init, env);
}

async function setUpRoundWithOneScore() {
  const course = await json<{ id: number }>(
    await request("/api/courses", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Maple Hill" }),
    }),
  );
  const layout = await json<{ id: number }>(
    await request(`/api/courses/${course.id}/layouts`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Blue" }),
    }),
  );
  await request(`/api/layouts/${layout.id}/holes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ number: 1, par: 3 }),
  });
  const player = await json<{ id: number }>(
    await request("/api/players", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "Alice" }),
    }),
  );
  const round = await json<{
    scores: Array<{ id: number; strokes: number; penalties: number }>;
  }>(
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId: course.id,
        layoutId: layout.id,
        playerIds: [player.id],
      }),
    }),
  );
  return round.scores[0];
}

describe("hole-scores API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
    await env.DB.exec("DELETE FROM players");
  });

  it("updates strokes only", async () => {
    const score = await setUpRoundWithOneScore();
    expect(score).toMatchObject({ strokes: 3, penalties: 0 });

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 4 }),
    });
    expect(res.status).toBe(200);
    const updated = await json<{ strokes: number; penalties: number }>(res);
    expect(updated).toMatchObject({ strokes: 4, penalties: 0 });
  });

  it("updates penalties only, leaving strokes untouched", async () => {
    const score = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ penalties: 2 }),
    });
    const updated = await json<{ strokes: number; penalties: number }>(res);
    expect(updated).toMatchObject({ strokes: 3, penalties: 2 });
  });

  it("404s for a hole score that doesn't exist", async () => {
    const res = await request("/api/hole-scores/999", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 4 }),
    });
    expect(res.status).toBe(404);
  });

  it("rejects strokes below 1", async () => {
    const score = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 0 }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects a body with neither field", async () => {
    const score = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
