import { Hono } from "hono";
import type { Env } from "../types";
import { createRoundSchema } from "../schemas";

interface RoundRow {
  id: number;
  course_id: number;
  layout_id: number;
  created_at: string;
}

interface RoundListRow {
  id: number;
  created_at: string;
  course_name: string;
  layout_name: string;
  player_count: number;
}

interface HoleRow {
  id: number;
  number: number;
  par: number;
  distance_meters: number | null;
}

interface PlayerRow {
  id: number;
  name: string;
}

interface HoleScoreRow {
  id: number;
  hole_id: number;
  player_id: number;
  strokes: number;
  penalties: number;
}

async function buildRoundDetail(db: D1Database, roundId: number) {
  const round = await db
    .prepare(
      `SELECT rounds.id, rounds.course_id, rounds.layout_id, rounds.created_at,
              courses.name AS course_name, layouts.name AS layout_name
       FROM rounds
       JOIN courses ON courses.id = rounds.course_id
       JOIN layouts ON layouts.id = rounds.layout_id
       WHERE rounds.id = ?`,
    )
    .bind(roundId)
    .first<RoundRow & { course_name: string; layout_name: string }>();

  if (!round) {
    return null;
  }

  const [
    { results: holeRows },
    { results: playerRows },
    { results: scoreRows },
  ] = await Promise.all([
    db
      .prepare(
        "SELECT id, number, par, distance_meters FROM holes WHERE layout_id = ? ORDER BY number",
      )
      .bind(round.layout_id)
      .all<HoleRow>(),
    db
      .prepare(
        `SELECT players.id, players.name
           FROM round_players
           JOIN players ON players.id = round_players.player_id
           WHERE round_players.round_id = ?
           ORDER BY players.name`,
      )
      .bind(roundId)
      .all<PlayerRow>(),
    db
      .prepare(
        "SELECT id, hole_id, player_id, strokes, penalties FROM hole_scores WHERE round_id = ?",
      )
      .bind(roundId)
      .all<HoleScoreRow>(),
  ]);

  return {
    id: round.id,
    createdAt: round.created_at,
    course: { id: round.course_id, name: round.course_name },
    layout: { id: round.layout_id, name: round.layout_name },
    holes: holeRows.map((hole) => ({
      id: hole.id,
      number: hole.number,
      par: hole.par,
      distanceMeters: hole.distance_meters,
    })),
    players: playerRows.map((player) => ({ id: player.id, name: player.name })),
    scores: scoreRows.map((score) => ({
      id: score.id,
      holeId: score.hole_id,
      playerId: score.player_id,
      strokes: score.strokes,
      penalties: score.penalties,
    })),
  };
}

export const roundsRoute = new Hono<{ Bindings: Env }>();

roundsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const { courseId, layoutId, playerIds } = parsed.data;
  const uniquePlayerIds = [...new Set(playerIds)];

  const layout = await c.env.DB.prepare(
    "SELECT id FROM layouts WHERE id = ? AND course_id = ?",
  )
    .bind(layoutId, courseId)
    .first();
  if (!layout) {
    return c.json(
      { error: "That layout does not belong to the given course" },
      404,
    );
  }

  const placeholders = uniquePlayerIds.map(() => "?").join(",");
  const { results: existingPlayers } = await c.env.DB.prepare(
    `SELECT id FROM players WHERE id IN (${placeholders})`,
  )
    .bind(...uniquePlayerIds)
    .all();
  if (existingPlayers.length !== uniquePlayerIds.length) {
    return c.json({ error: "One or more players were not found" }, 404);
  }

  const { results: holes } = await c.env.DB.prepare(
    "SELECT id, par FROM holes WHERE layout_id = ?",
  )
    .bind(layoutId)
    .all<{ id: number; par: number }>();

  const round = await c.env.DB.prepare(
    "INSERT INTO rounds (course_id, layout_id) VALUES (?, ?) RETURNING id",
  )
    .bind(courseId, layoutId)
    .first<{ id: number }>();
  const roundId = round!.id;

  const statements = [
    ...uniquePlayerIds.map((playerId) =>
      c.env.DB.prepare(
        "INSERT INTO round_players (round_id, player_id) VALUES (?, ?)",
      ).bind(roundId, playerId),
    ),
    ...uniquePlayerIds.flatMap((playerId) =>
      holes.map((hole) =>
        c.env.DB.prepare(
          `INSERT INTO hole_scores (round_id, player_id, hole_id, strokes, penalties)
           VALUES (?, ?, ?, ?, 0)`,
        ).bind(roundId, playerId, hole.id, hole.par),
      ),
    ),
  ];
  await c.env.DB.batch(statements);

  const detail = await buildRoundDetail(c.env.DB, roundId);
  return c.json(detail, 201);
});

roundsRoute.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT rounds.id, rounds.created_at,
            courses.name AS course_name, layouts.name AS layout_name,
            COUNT(DISTINCT round_players.player_id) AS player_count
     FROM rounds
     JOIN courses ON courses.id = rounds.course_id
     JOIN layouts ON layouts.id = rounds.layout_id
     LEFT JOIN round_players ON round_players.round_id = rounds.id
     GROUP BY rounds.id
     ORDER BY rounds.created_at DESC`,
  ).all<RoundListRow>();

  return c.json({
    rounds: results.map((row) => ({
      id: row.id,
      createdAt: row.created_at,
      courseName: row.course_name,
      layoutName: row.layout_name,
      playerCount: row.player_count,
    })),
  });
});

roundsRoute.get("/:roundId", async (c) => {
  const roundId = Number(c.req.param("roundId"));
  if (!Number.isInteger(roundId)) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const detail = await buildRoundDetail(c.env.DB, roundId);
  if (!detail) {
    return c.json({ error: "Round not found" }, 404);
  }

  return c.json(detail);
});
