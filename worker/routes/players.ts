import { Hono } from "hono";
import type { Env } from "../types";
import { createPlayerSchema } from "../schemas";

interface PlayerRow {
  id: number;
  name: string;
  created_at: string;
}

export const playersRoute = new Hono<{ Bindings: Env }>();

playersRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createPlayerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const row = await c.env.DB.prepare(
    "INSERT INTO players (name) VALUES (?) RETURNING id, name, created_at",
  )
    .bind(parsed.data.name)
    .first<PlayerRow>();

  return c.json(
    { id: row!.id, name: row!.name, createdAt: row!.created_at },
    201,
  );
});

playersRoute.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, created_at FROM players ORDER BY name",
  ).all<PlayerRow>();

  return c.json({
    players: results.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
    })),
  });
});
