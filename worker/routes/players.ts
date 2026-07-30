import { Hono } from "hono";
import type { Env } from "../types";
import { createPlayerSchema, updatePlayerSchema } from "../schemas";

interface PlayerRow {
  id: number;
  name: string;
  created_at: string;
}

interface PlayerListRow extends PlayerRow {
  round_count: number;
}

interface PlayedLayoutRow {
  course_id: number;
  course_name: string;
  layout_id: number;
  layout_name: string;
}

interface HoleStatRow {
  hole_id: number;
  number: number;
  par: number;
  times_played: number;
  avg_strokes: number;
  best_strokes: number;
  worst_strokes: number;
  avg_penalties: number;
}

async function countPlayerRounds(db: D1Database, playerId: number) {
  const row = await db
    .prepare(
      "SELECT COUNT(DISTINCT round_id) AS round_count FROM round_players WHERE player_id = ?",
    )
    .bind(playerId)
    .first<{ round_count: number }>();
  return row!.round_count;
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
    { id: row!.id, name: row!.name, createdAt: row!.created_at, roundCount: 0 },
    201,
  );
});

playersRoute.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT players.id, players.name, players.created_at,
            COUNT(DISTINCT round_players.round_id) AS round_count
     FROM players
     LEFT JOIN round_players ON round_players.player_id = players.id
     GROUP BY players.id
     ORDER BY players.name`,
  ).all<PlayerListRow>();

  return c.json({
    players: results.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      roundCount: row.round_count,
    })),
  });
});

playersRoute.patch("/:playerId", async (c) => {
  const playerId = Number(c.req.param("playerId"));
  if (!Number.isInteger(playerId)) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!existing) {
    return c.json({ error: "Player not found" }, 404);
  }

  const row = await c.env.DB.prepare(
    "UPDATE players SET name = ? WHERE id = ? RETURNING id, name, created_at",
  )
    .bind(parsed.data.name, playerId)
    .first<PlayerRow>();

  const roundCount = await countPlayerRounds(c.env.DB, playerId);

  return c.json({
    id: row!.id,
    name: row!.name,
    createdAt: row!.created_at,
    roundCount,
  });
});

playersRoute.delete("/:playerId", async (c) => {
  const playerId = Number(c.req.param("playerId"));
  if (!Number.isInteger(playerId)) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const existing = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!existing) {
    return c.json({ error: "Player not found" }, 404);
  }

  const roundCount = await countPlayerRounds(c.env.DB, playerId);

  if (roundCount > 0) {
    return c.json(
      { error: "Cannot delete a player with recorded rounds" },
      409,
    );
  }

  await c.env.DB.prepare("DELETE FROM players WHERE id = ?")
    .bind(playerId)
    .run();

  return c.body(null, 204);
});

playersRoute.get("/:playerId/layouts", async (c) => {
  const playerId = Number(c.req.param("playerId"));
  if (!Number.isInteger(playerId)) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const player = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT DISTINCT courses.id AS course_id, courses.name AS course_name,
            layouts.id AS layout_id, layouts.name AS layout_name
     FROM rounds
     JOIN round_players ON round_players.round_id = rounds.id
     JOIN courses ON courses.id = rounds.course_id
     JOIN layouts ON layouts.id = rounds.layout_id
     WHERE round_players.player_id = ? AND rounds.completed_at IS NOT NULL
     ORDER BY courses.name, layouts.name`,
  )
    .bind(playerId)
    .all<PlayedLayoutRow>();

  return c.json({
    layouts: results.map((row) => ({
      courseId: row.course_id,
      courseName: row.course_name,
      layoutId: row.layout_id,
      layoutName: row.layout_name,
    })),
  });
});

playersRoute.get("/:playerId/stats", async (c) => {
  const playerId = Number(c.req.param("playerId"));
  if (!Number.isInteger(playerId)) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const layoutId = Number(c.req.query("layoutId"));
  if (!Number.isInteger(layoutId)) {
    return c.json({ error: "layoutId query parameter is required" }, 400);
  }

  const player = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  const { results } = await c.env.DB.prepare(
    `SELECT holes.id AS hole_id, holes.number, holes.par,
            COUNT(*) AS times_played,
            AVG(hole_scores.strokes) AS avg_strokes,
            MIN(hole_scores.strokes) AS best_strokes,
            MAX(hole_scores.strokes) AS worst_strokes,
            AVG(hole_scores.penalties) AS avg_penalties
     FROM hole_scores
     JOIN rounds ON rounds.id = hole_scores.round_id
     JOIN holes ON holes.id = hole_scores.hole_id
     WHERE hole_scores.player_id = ?
       AND rounds.layout_id = ?
       AND rounds.completed_at IS NOT NULL
     GROUP BY holes.id
     ORDER BY holes.number`,
  )
    .bind(playerId, layoutId)
    .all<HoleStatRow>();

  return c.json({
    holes: results.map((row) => ({
      holeId: row.hole_id,
      number: row.number,
      par: row.par,
      timesPlayed: row.times_played,
      avgStrokes: row.avg_strokes,
      bestStrokes: row.best_strokes,
      worstStrokes: row.worst_strokes,
      avgPenalties: row.avg_penalties,
    })),
  });
});
