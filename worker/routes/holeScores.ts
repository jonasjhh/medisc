import { Hono } from "hono";
import type { Env } from "../types";
import { updateHoleScoreSchema } from "../schemas";

interface HoleScoreRow {
  id: number;
  round_id: number;
  hole_id: number;
  player_id: number;
  strokes: number;
  penalties: number;
}

export const holeScoresRoute = new Hono<{ Bindings: Env }>();

holeScoresRoute.patch("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) {
    return c.json({ error: "Invalid hole score id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateHoleScoreSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id, strokes, penalties FROM hole_scores WHERE id = ?",
  )
    .bind(id)
    .first<{ id: number; strokes: number; penalties: number }>();
  if (!existing) {
    return c.json({ error: "Hole score not found" }, 404);
  }

  const strokes = parsed.data.strokes ?? existing.strokes;
  const penalties = parsed.data.penalties ?? existing.penalties;

  const row = await c.env.DB.prepare(
    `UPDATE hole_scores SET strokes = ?, penalties = ?
     WHERE id = ?
     RETURNING id, round_id, hole_id, player_id, strokes, penalties`,
  )
    .bind(strokes, penalties, id)
    .first<HoleScoreRow>();

  return c.json({
    id: row!.id,
    roundId: row!.round_id,
    holeId: row!.hole_id,
    playerId: row!.player_id,
    strokes: row!.strokes,
    penalties: row!.penalties,
  });
});
