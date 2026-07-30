import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";

interface PlayerResponse {
  id: number;
  name: string;
  createdAt: string;
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("players API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM players");
  });

  it("creates and lists players", async () => {
    const createRes = await app.request(
      "/api/players",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Jonas" }),
      },
      env,
    );
    expect(createRes.status).toBe(201);
    const created = await json<PlayerResponse>(createRes);
    expect(created).toMatchObject({ name: "Jonas" });

    const listRes = await app.request("/api/players", {}, env);
    const { players } = await json<{ players: PlayerResponse[] }>(listRes);
    expect(players).toEqual([
      { id: created.id, name: "Jonas", createdAt: created.createdAt },
    ]);
  });

  it("rejects an empty name", async () => {
    const res = await app.request(
      "/api/players",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "" }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});
