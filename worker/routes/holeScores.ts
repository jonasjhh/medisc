import { Hono } from "hono";
import type { AppEnv } from "../types";
import { updateHoleScoreSchema } from "../schemas";
import { parseIntParam } from "../params";

interface HoleScoreRow {
  id: number;
  round_id: number;
  hole_id: number;
  player_id: number;
  strokes: number;
  penalties: number;
  recorded: number;
}

export const holeScoresRoute = new Hono<AppEnv>();

holeScoresRoute.patch("/:id", async (c) => {
  const id = parseIntParam(c.req.param("id"));
  if (id === null) {
    return c.json({ error: "Invalid hole score id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateHoleScoreSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await c.env.DB.prepare(
    `SELECT hole_scores.strokes, hole_scores.penalties,
            rounds.completed_at
     FROM hole_scores
     JOIN rounds ON rounds.id = hole_scores.round_id
     WHERE hole_scores.id = ?`,
  )
    .bind(id)
    .first<{
      strokes: number;
      penalties: number;
      completed_at: string | null;
    }>();
  if (!existing) {
    return c.json({ error: "Hole score not found" }, 404);
  }
  if (existing.completed_at) {
    return c.json({ error: "Cannot edit a completed round" }, 409);
  }

  const strokes = parsed.data.strokes ?? existing.strokes;
  const penalties = parsed.data.penalties ?? existing.penalties;

  const row = await c.env.DB.prepare(
    `UPDATE hole_scores SET strokes = ?, penalties = ?, recorded = 1
     WHERE id = ?
     RETURNING id, round_id, hole_id, player_id, strokes, penalties, recorded`,
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
    recorded: Boolean(row!.recorded),
  });
});
