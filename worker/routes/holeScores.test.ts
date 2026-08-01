import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import type { ZodTypeAny, z } from "zod";
import app from "../index";
import { seedCourse } from "../test/seed";
import {
  holeScoreResponseSchema,
  roundDetailSchema,
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

async function setUpRoundWithOneScore() {
  const { courseId, layoutId } = await seedCourse(env, {
    courseName: "Maple Hill",
    layoutName: "Blue",
    holes: [{ number: 1, par: 3 }],
  });
  const playerResponse = await request("/api/players", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "Alice" }),
  });
  const player = (await playerResponse.json()) as { id: number };
  const round = await json(
    await request("/api/rounds", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        courseId,
        layoutId,
        playerIds: [player.id],
      }),
    }),
    roundDetailSchema,
  );
  return { roundId: round.id, score: round.scores[0] };
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
    const { score } = await setUpRoundWithOneScore();
    expect(score).toMatchObject({
      strokes: 3,
      penalties: 0,
      recorded: false,
    });

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 4 }),
    });
    expect(res.status).toBe(200);
    const updated = await json(res, holeScoreResponseSchema);
    expect(updated).toMatchObject({ strokes: 4, penalties: 0, recorded: true });
  });

  it("updates penalties only, leaving strokes untouched", async () => {
    const { score } = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ penalties: 2 }),
    });
    const updated = await json(res, holeScoreResponseSchema);
    expect(updated).toMatchObject({ strokes: 3, penalties: 2, recorded: true });
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
    const { score } = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 0 }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects a body with neither field", async () => {
    const { score } = await setUpRoundWithOneScore();

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("rejects edits once the round is completed", async () => {
    const { roundId, score } = await setUpRoundWithOneScore();
    await request(`/api/rounds/${roundId}/complete`, { method: "POST" });

    const res = await request(`/api/hole-scores/${score.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ strokes: 5 }),
    });
    expect(res.status).toBe(409);
  });
});
