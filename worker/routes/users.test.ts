import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";
import { seedUser } from "../test/seed";

interface UserResponse {
  id: number;
  createdAt: string;
  claimedPlayer: { id: number; name: string } | null;
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function request(path: string, init?: RequestInit): Promise<Response> {
  return app.request(path, init, env);
}

describe("users API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
    await env.DB.exec("DELETE FROM device_link_codes");
    await env.DB.exec("DELETE FROM device_tokens");
    await env.DB.exec("DELETE FROM players");
    await env.DB.exec("DELETE FROM users");
  });

  describe("GET /me", () => {
    it("400s without a device token header", async () => {
      const res = await request("/api/users/me");
      expect(res.status).toBe(400);
    });

    it("returns a null user for an unknown token", async () => {
      const res = await request("/api/users/me", {
        headers: { "X-Device-Token": "unknown-token" },
      });
      expect(res.status).toBe(200);
      expect(await json<{ user: null }>(res)).toEqual({ user: null });
    });

    it("resolves a known token to its user", async () => {
      const { userId, deviceToken } = await seedUser(env);
      const res = await request("/api/users/me", {
        headers: { "X-Device-Token": deviceToken },
      });
      expect(await json<{ user: UserResponse }>(res)).toEqual({
        user: {
          id: userId,
          createdAt: expect.any(String),
          claimedPlayer: null,
        },
      });
    });
  });

  describe("POST /", () => {
    it("400s without a device token header", async () => {
      const res = await request("/api/users", { method: "POST" });
      expect(res.status).toBe(400);
    });

    it("creates a user for a new token", async () => {
      const res = await request("/api/users", {
        method: "POST",
        headers: { "X-Device-Token": "brand-new-token" },
      });
      expect(res.status).toBe(201);
      const { user } = await json<{ user: UserResponse }>(res);
      expect(user.claimedPlayer).toBeNull();

      const meRes = await request("/api/users/me", {
        headers: { "X-Device-Token": "brand-new-token" },
      });
      expect((await json<{ user: UserResponse }>(meRes)).user.id).toBe(user.id);
    });

    it("is idempotent for an already-mapped token", async () => {
      const { userId, deviceToken } = await seedUser(env);
      const res = await request("/api/users", {
        method: "POST",
        headers: { "X-Device-Token": deviceToken },
      });
      expect(res.status).toBe(200);
      expect((await json<{ user: UserResponse }>(res)).user.id).toBe(userId);
    });
  });

  describe("POST /me/link-code", () => {
    it("401s without a resolved user", async () => {
      const res = await request("/api/users/me/link-code", {
        method: "POST",
        headers: { "X-Device-Token": "unknown-token" },
      });
      expect(res.status).toBe(401);
    });

    it("generates an 8-character unambiguous code for a resolved user", async () => {
      const { deviceToken } = await seedUser(env);
      const res = await request("/api/users/me/link-code", {
        method: "POST",
        headers: { "X-Device-Token": deviceToken },
      });
      expect(res.status).toBe(201);
      const { code, expiresAt } = await json<{
        code: string;
        expiresAt: string;
      }>(res);
      expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/);
      expect(expiresAt).toEqual(expect.any(String));
    });
  });

  describe("POST /link", () => {
    it("400s without a device token header", async () => {
      const res = await request("/api/users/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: "ABCDEFGH" }),
      });
      expect(res.status).toBe(400);
    });

    it("400s an invalid code shape", async () => {
      const res = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": "device-b",
        },
        body: JSON.stringify({ code: "short" }),
      });
      expect(res.status).toBe(400);
    });

    it("404s an unknown code", async () => {
      const res = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": "device-b",
        },
        body: JSON.stringify({ code: "NOTAREAL" }),
      });
      expect(res.status).toBe(404);
    });

    it("409s if this device already has a user", async () => {
      const { deviceToken } = await seedUser(env);
      const res = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": deviceToken,
        },
        body: JSON.stringify({ code: "ABCDEFGH" }),
      });
      expect(res.status).toBe(409);
    });

    it("409s an expired code", async () => {
      const { userId } = await seedUser(env);
      await env.DB.prepare(
        `INSERT INTO device_link_codes (code, user_id, expires_at)
         VALUES (?, ?, datetime('now', '-1 minutes'))`,
      )
        .bind("EXPIRED1", userId)
        .run();

      const res = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": "device-b",
        },
        body: JSON.stringify({ code: "EXPIRED1" }),
      });
      expect(res.status).toBe(409);
    });

    it("409s a code that's already been used", async () => {
      const { userId } = await seedUser(env);
      await env.DB.prepare(
        `INSERT INTO device_link_codes (code, user_id, expires_at, used_at)
         VALUES (?, ?, datetime('now', '+15 minutes'), datetime('now'))`,
      )
        .bind("USEDCODE", userId)
        .run();

      const res = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": "device-b",
        },
        body: JSON.stringify({ code: "USEDCODE" }),
      });
      expect(res.status).toBe(409);
    });

    it("links a second device to the same user and it inherits the claimed player", async () => {
      const { userId, deviceToken: deviceA } = await seedUser(env);

      const player = await json<{ id: number }>(
        await request("/api/players", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Alice" }),
        }),
      );
      await request(`/api/players/${player.id}/claim`, {
        method: "POST",
        headers: { "X-Device-Token": deviceA },
      });

      const codeRes = await request("/api/users/me/link-code", {
        method: "POST",
        headers: { "X-Device-Token": deviceA },
      });
      const { code } = await json<{ code: string }>(codeRes);

      const linkRes = await request("/api/users/link", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "X-Device-Token": "device-b",
        },
        body: JSON.stringify({ code }),
      });
      expect(linkRes.status).toBe(200);
      const { user } = await json<{ user: UserResponse }>(linkRes);
      expect(user.id).toBe(userId);
      expect(user.claimedPlayer).toEqual({ id: player.id, name: "Alice" });

      const meRes = await request("/api/users/me", {
        headers: { "X-Device-Token": "device-b" },
      });
      expect((await json<{ user: UserResponse }>(meRes)).user.id).toBe(userId);
    });
  });

  describe("POST /me/unclaim", () => {
    it("401s without a resolved user", async () => {
      const res = await request("/api/users/me/unclaim", { method: "POST" });
      expect(res.status).toBe(401);
    });

    it("404s if the user has no claimed player", async () => {
      const { deviceToken } = await seedUser(env);
      const res = await request("/api/users/me/unclaim", {
        method: "POST",
        headers: { "X-Device-Token": deviceToken },
      });
      expect(res.status).toBe(404);
    });

    it("releases a claimed player, allowing a different user to claim it", async () => {
      const { deviceToken: deviceA } = await seedUser(env);
      const { deviceToken: deviceB } = await seedUser(env);
      const player = await json<{ id: number }>(
        await request("/api/players", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ name: "Alice" }),
        }),
      );
      await request(`/api/players/${player.id}/claim`, {
        method: "POST",
        headers: { "X-Device-Token": deviceA },
      });

      const unclaimRes = await request("/api/users/me/unclaim", {
        method: "POST",
        headers: { "X-Device-Token": deviceA },
      });
      expect(unclaimRes.status).toBe(200);
      expect(
        (await json<{ user: UserResponse }>(unclaimRes)).user.claimedPlayer,
      ).toBeNull();

      const claimRes = await request(`/api/players/${player.id}/claim`, {
        method: "POST",
        headers: { "X-Device-Token": deviceB },
      });
      expect(claimRes.status).toBe(200);
    });
  });
});
