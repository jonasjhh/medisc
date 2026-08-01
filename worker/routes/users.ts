import { Hono } from "hono";
import type { AppEnv } from "../types";
import { linkDeviceSchema } from "../schemas";
import {
  currentUserResponseSchema,
  identityUserSchema,
  linkCodeResponseSchema,
  userResponseSchema,
} from "../../shared/contracts/identity";

interface UserRow {
  id: number;
  created_at: string;
}

interface ClaimedPlayerRow {
  id: number;
  name: string;
}

// Excludes ambiguous characters (0/O, 1/I/L) so codes are easy to read and
// type on a phone.
const LINK_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const LINK_CODE_LENGTH = 8;
const LINK_CODE_TTL_MINUTES = 15;

function generateLinkCode(): string {
  const bytes = new Uint8Array(LINK_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(
    bytes,
    (b) => LINK_CODE_ALPHABET[b % LINK_CODE_ALPHABET.length],
  ).join("");
}

async function loadUser(db: D1Database, userId: number) {
  const user = await db
    .prepare("SELECT id, created_at FROM users WHERE id = ?")
    .bind(userId)
    .first<UserRow>();
  if (!user) {
    return null;
  }

  const claimedPlayer = await db
    .prepare("SELECT id, name FROM players WHERE claimed_by_user_id = ?")
    .bind(userId)
    .first<ClaimedPlayerRow>();

  return identityUserSchema.parse({
    id: user.id,
    createdAt: user.created_at,
    claimedPlayer: claimedPlayer
      ? { id: claimedPlayer.id, name: claimedPlayer.name }
      : null,
  });
}

export const usersRoute = new Hono<AppEnv>();

usersRoute.get("/me", async (c) => {
  const token = c.get("deviceToken");
  if (!token) {
    return c.json({ error: "X-Device-Token header required" }, 400);
  }
  const userId = c.get("userId");
  if (userId === null) {
    return c.json(currentUserResponseSchema.parse({ user: null }));
  }
  const user = await loadUser(c.env.DB, userId);
  return c.json(currentUserResponseSchema.parse({ user }));
});

usersRoute.post("/", async (c) => {
  const token = c.get("deviceToken");
  if (!token) {
    return c.json({ error: "X-Device-Token header required" }, 400);
  }

  const existingUserId = c.get("userId");
  if (existingUserId !== null) {
    const user = await loadUser(c.env.DB, existingUserId);
    return c.json(userResponseSchema.parse({ user }), 200);
  }

  const created = await c.env.DB.prepare(
    "INSERT INTO users (created_at) VALUES (datetime('now')) RETURNING id, created_at",
  ).first<UserRow>();

  await c.env.DB.prepare(
    "INSERT INTO device_tokens (token, user_id) VALUES (?, ?)",
  )
    .bind(token, created!.id)
    .run();

  return c.json(
    userResponseSchema.parse({
      user: {
        id: created!.id,
        createdAt: created!.created_at,
        claimedPlayer: null,
      },
    }),
    201,
  );
});

usersRoute.post("/me/link-code", async (c) => {
  const userId = c.get("userId");
  if (userId === null) {
    return c.json({ error: "No user found for this device" }, 401);
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateLinkCode();
    try {
      const row = await c.env.DB.prepare(
        `INSERT INTO device_link_codes (code, user_id, expires_at)
         VALUES (?, ?, datetime('now', '+${LINK_CODE_TTL_MINUTES} minutes'))
         RETURNING code, expires_at`,
      )
        .bind(code, userId)
        .first<{ code: string; expires_at: string }>();
      return c.json(
        linkCodeResponseSchema.parse({
          code: row!.code,
          expiresAt: row!.expires_at,
        }),
        201,
      );
    } catch {
      // UNIQUE collision on code — extremely unlikely at this volume; retry.
      continue;
    }
  }
  return c.json({ error: "Could not generate a link code, try again" }, 500);
});

usersRoute.post("/link", async (c) => {
  const token = c.get("deviceToken");
  if (!token) {
    return c.json({ error: "X-Device-Token header required" }, 400);
  }
  if (c.get("userId") !== null) {
    return c.json({ error: "This device is already linked to a user" }, 409);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = linkDeviceSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const linkCode = await c.env.DB.prepare(
    "SELECT id, user_id, expires_at, used_at FROM device_link_codes WHERE code = ?",
  )
    .bind(parsed.data.code)
    .first<{
      id: number;
      user_id: number;
      expires_at: string;
      used_at: string | null;
    }>();

  if (!linkCode) {
    return c.json({ error: "Invalid code" }, 404);
  }
  if (linkCode.used_at !== null) {
    return c.json({ error: "Code has already been used" }, 409);
  }

  const consumed = await c.env.DB.prepare(
    `UPDATE device_link_codes SET used_at = datetime('now')
     WHERE id = ? AND used_at IS NULL AND expires_at > datetime('now')`,
  )
    .bind(linkCode.id)
    .run();
  if (consumed.meta.changes === 0) {
    return c.json({ error: "Code has expired or already been used" }, 409);
  }

  await c.env.DB.prepare(
    "INSERT INTO device_tokens (token, user_id) VALUES (?, ?)",
  )
    .bind(token, linkCode.user_id)
    .run();

  const user = await loadUser(c.env.DB, linkCode.user_id);
  return c.json(userResponseSchema.parse({ user }), 200);
});

usersRoute.post("/me/unclaim", async (c) => {
  const userId = c.get("userId");
  if (userId === null) {
    return c.json({ error: "No user found for this device" }, 401);
  }

  const updated = await c.env.DB.prepare(
    "UPDATE players SET claimed_by_user_id = NULL WHERE claimed_by_user_id = ?",
  )
    .bind(userId)
    .run();
  if (updated.meta.changes === 0) {
    return c.json({ error: "No claimed player to release" }, 404);
  }

  const user = await loadUser(c.env.DB, userId);
  return c.json(userResponseSchema.parse({ user }));
});
