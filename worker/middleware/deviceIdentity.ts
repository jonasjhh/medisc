import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types";

interface DeviceTokenRow {
  user_id: number;
}

// Resolves the X-Device-Token header into a userId, but never blocks a
// request itself — routes that require a resolved user check c.get("userId")
// and reject on their own terms (401/404/etc).
export const deviceIdentityMiddleware = createMiddleware<AppEnv>(
  async (c, next) => {
    const token = c.req.header("X-Device-Token") ?? null;
    c.set("deviceToken", token);

    let userId: number | null = null;
    if (token) {
      const row = await c.env.DB.prepare(
        "SELECT user_id FROM device_tokens WHERE token = ?",
      )
        .bind(token)
        .first<DeviceTokenRow>();
      userId = row ? row.user_id : null;
    }
    c.set("userId", userId);

    await next();
  },
);
