import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("scores API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM scores");
  });

  it("records a visit and returns updated totals", async () => {
    const first = await app.request(
      "/api/scores",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "user-1", score: 1 }),
      },
      env,
    );
    expect(await json<unknown>(first)).toEqual({
      totalVisits: 1,
      yourVisits: 1,
    });

    const second = await app.request(
      "/api/scores",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: "user-2", score: 1 }),
      },
      env,
    );
    expect(await json<unknown>(second)).toEqual({
      totalVisits: 2,
      yourVisits: 1,
    });
  });

  it("rejects a missing userId", async () => {
    const res = await app.request(
      "/api/scores",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score: 1 }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it("returns the leaderboard ordered by total score", async () => {
    for (const userId of ["a", "a", "b"]) {
      await app.request(
        "/api/scores",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ userId, score: 1 }),
        },
        env,
      );
    }

    const res = await app.request("/api/scores/top", {}, env);
    const { scores } = await json<{ scores: unknown[] }>(res);
    expect(scores[0]).toMatchObject({ userId: "a", totalScore: 2, visits: 2 });
    expect(scores[1]).toMatchObject({ userId: "b", totalScore: 1, visits: 1 });
  });
});
