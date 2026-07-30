import { Hono } from "hono";
import type { Env } from "../types";
import { createHoleSchema } from "../schemas";

interface HoleRow {
  id: number;
  layout_id: number;
  number: number;
  par: number;
  distance_feet: number | null;
}

export const layoutsRoute = new Hono<{ Bindings: Env }>();

layoutsRoute.post("/:layoutId/holes", async (c) => {
  const layoutId = Number(c.req.param("layoutId"));
  if (!Number.isInteger(layoutId)) {
    return c.json({ error: "Invalid layout id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = createHoleSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const layout = await c.env.DB.prepare("SELECT id FROM layouts WHERE id = ?")
    .bind(layoutId)
    .first();
  if (!layout) {
    return c.json({ error: "Layout not found" }, 404);
  }

  const { number, par, distanceFeet } = parsed.data;

  const existing = await c.env.DB.prepare(
    "SELECT id FROM holes WHERE layout_id = ? AND number = ?",
  )
    .bind(layoutId, number)
    .first();
  if (existing) {
    return c.json(
      { error: `Hole ${number} already exists on this layout` },
      409,
    );
  }

  const row = await c.env.DB.prepare(
    `INSERT INTO holes (layout_id, number, par, distance_feet)
     VALUES (?, ?, ?, ?)
     RETURNING id, layout_id, number, par, distance_feet`,
  )
    .bind(layoutId, number, par, distanceFeet ?? null)
    .first<HoleRow>();

  return c.json(
    {
      id: row!.id,
      layoutId: row!.layout_id,
      number: row!.number,
      par: row!.par,
      distanceFeet: row!.distance_feet,
    },
    201,
  );
});
