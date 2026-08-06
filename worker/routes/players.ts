import { Hono } from "hono";
import type { AppEnv } from "../types";
import { createPlayerSchema, updatePlayerSchema } from "../schemas";
import { parseIntParam } from "../params";
import {
  holeStatsResponseSchema,
  playedLayoutsResponseSchema,
  playerListResponseSchema,
  playerSchema,
  recentCoursesResponseSchema,
  scoreDistributionResponseSchema,
  type ScoreDistribution,
} from "../../shared/contracts/players";

interface PlayerRow {
  id: number;
  name: string;
  created_at: string;
  claimed_by_user_id: number | null;
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

interface ScoreBucketRow {
  bucket: keyof ScoreDistribution;
  count: number;
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

function serializePlayer(row: PlayerRow, roundCount: number) {
  return playerSchema.parse({
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    roundCount,
    claimedByUserId: row.claimed_by_user_id,
  });
}

export const playersRoute = new Hono<AppEnv>();

playersRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createPlayerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const row = await c.env.DB.prepare(
    "INSERT INTO players (name) VALUES (?) RETURNING id, name, created_at, claimed_by_user_id",
  )
    .bind(parsed.data.name)
    .first<PlayerRow>();

  return c.json(serializePlayer(row!, 0), 201);
});

playersRoute.get("/", async (c) => {
  const unclaimedOnly = c.req.query("unclaimed") === "true";
  const where = unclaimedOnly ? "WHERE players.claimed_by_user_id IS NULL" : "";
  const { results } = await c.env.DB.prepare(
    `SELECT players.id, players.name, players.created_at, players.claimed_by_user_id,
            COUNT(DISTINCT round_players.round_id) AS round_count
     FROM players
     LEFT JOIN round_players ON round_players.player_id = players.id
     ${where}
     GROUP BY players.id
     ORDER BY players.name`,
  ).all<PlayerListRow>();

  return c.json(
    playerListResponseSchema.parse({
      players: results.map((row) => serializePlayer(row, row.round_count)),
    }),
  );
});

playersRoute.patch("/:playerId", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updatePlayerSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT claimed_by_user_id FROM players WHERE id = ?",
  )
    .bind(playerId)
    .first<{ claimed_by_user_id: number | null }>();
  if (!existing) {
    return c.json({ error: "Player not found" }, 404);
  }

  if (
    existing.claimed_by_user_id !== null &&
    existing.claimed_by_user_id !== c.get("userId")
  ) {
    return c.json(
      { error: "Only the player who claimed this profile can edit it" },
      403,
    );
  }

  const row = await c.env.DB.prepare(
    "UPDATE players SET name = ? WHERE id = ? RETURNING id, name, created_at, claimed_by_user_id",
  )
    .bind(parsed.data.name, playerId)
    .first<PlayerRow>();

  const roundCount = await countPlayerRounds(c.env.DB, playerId);

  return c.json(serializePlayer(row!, roundCount));
});

playersRoute.delete("/:playerId", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const existing = await c.env.DB.prepare(
    "SELECT claimed_by_user_id FROM players WHERE id = ?",
  )
    .bind(playerId)
    .first<{ claimed_by_user_id: number | null }>();
  if (!existing) {
    return c.json({ error: "Player not found" }, 404);
  }

  if (existing.claimed_by_user_id !== null) {
    return c.json({ error: "Cannot delete a claimed player" }, 409);
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
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
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
     WHERE round_players.player_id = ?
       AND rounds.completed_at IS NOT NULL
       AND rounds.counting = 1
     ORDER BY courses.name, layouts.name`,
  )
    .bind(playerId)
    .all<PlayedLayoutRow>();

  return c.json(
    playedLayoutsResponseSchema.parse({
      layouts: results.map((row) => ({
        courseId: row.course_id,
        courseName: row.course_name,
        layoutId: row.layout_id,
        layoutName: row.layout_name,
      })),
    }),
  );
});

const RECENT_COURSES_LIMIT = 3;

playersRoute.get("/:playerId/recent-courses", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const player = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  // Ordered by the most recent round's id (not created_at, which only has
  // second-level resolution and can tie for rounds started close together)
  // for each distinct course/layout the player has ever started a round on.
  const { results } = await c.env.DB.prepare(
    `SELECT courses.id AS course_id, courses.name AS course_name,
            layouts.id AS layout_id, layouts.name AS layout_name,
            MAX(rounds.id) AS last_round_id
     FROM rounds
     JOIN round_players ON round_players.round_id = rounds.id
     JOIN courses ON courses.id = rounds.course_id
     JOIN layouts ON layouts.id = rounds.layout_id
     WHERE round_players.player_id = ?
     GROUP BY courses.id, layouts.id
     ORDER BY last_round_id DESC
     LIMIT ?`,
  )
    .bind(playerId, RECENT_COURSES_LIMIT)
    .all<PlayedLayoutRow & { last_round_id: number }>();

  return c.json(
    recentCoursesResponseSchema.parse({
      recentCourses: results.map((row) => ({
        courseId: row.course_id,
        courseName: row.course_name,
        layoutId: row.layout_id,
        layoutName: row.layout_name,
      })),
    }),
  );
});

playersRoute.get("/:playerId/stats", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const layoutId = parseIntParam(c.req.query("layoutId"));
  if (layoutId === null) {
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
       AND rounds.counting = 1
     GROUP BY holes.id
     ORDER BY holes.number`,
  )
    .bind(playerId, layoutId)
    .all<HoleStatRow>();

  return c.json(
    holeStatsResponseSchema.parse({
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
    }),
  );
});

playersRoute.get("/:playerId/score-distribution", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const player = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  // Buckets mirror src/rounds/scoreColor.ts's scoreOutcome(): an ace takes
  // priority over how far under par it is, then it's purely relative to par.
  const { results } = await c.env.DB.prepare(
    `SELECT
       CASE
         WHEN hole_scores.strokes = 1 THEN 'ace'
         WHEN hole_scores.strokes <= holes.par - 3 THEN 'albatross'
         WHEN hole_scores.strokes = holes.par - 2 THEN 'eagle'
         WHEN hole_scores.strokes = holes.par - 1 THEN 'birdie'
         WHEN hole_scores.strokes = holes.par THEN 'par'
         WHEN hole_scores.strokes = holes.par + 1 THEN 'bogey'
         WHEN hole_scores.strokes = holes.par + 2 THEN 'doubleBogey'
         ELSE 'worse'
       END AS bucket,
       COUNT(*) AS count
     FROM hole_scores
     JOIN rounds ON rounds.id = hole_scores.round_id
     JOIN holes ON holes.id = hole_scores.hole_id
     WHERE hole_scores.player_id = ?
       AND rounds.completed_at IS NOT NULL
       AND rounds.counting = 1
     GROUP BY bucket`,
  )
    .bind(playerId)
    .all<ScoreBucketRow>();

  const distribution: ScoreDistribution = {
    ace: 0,
    albatross: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleBogey: 0,
    worse: 0,
  };
  for (const row of results) {
    distribution[row.bucket] = row.count;
  }

  return c.json(scoreDistributionResponseSchema.parse({ distribution }));
});

playersRoute.post("/:playerId/claim", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  if (playerId === null) {
    return c.json({ error: "Invalid player id" }, 400);
  }

  const userId = c.get("userId");
  if (userId === null) {
    return c.json({ error: "No user found for this device" }, 401);
  }

  const player = await c.env.DB.prepare(
    "SELECT claimed_by_user_id FROM players WHERE id = ?",
  )
    .bind(playerId)
    .first<{ claimed_by_user_id: number | null }>();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }
  if (player.claimed_by_user_id !== null) {
    return c.json({ error: "Player is already claimed" }, 409);
  }

  const alreadyClaimed = await c.env.DB.prepare(
    "SELECT id FROM players WHERE claimed_by_user_id = ?",
  )
    .bind(userId)
    .first();
  if (alreadyClaimed) {
    return c.json(
      { error: "You have already claimed a different player" },
      409,
    );
  }

  const updated = await c.env.DB.prepare(
    "UPDATE players SET claimed_by_user_id = ? WHERE id = ? AND claimed_by_user_id IS NULL",
  )
    .bind(userId, playerId)
    .run();
  if (updated.meta.changes === 0) {
    return c.json({ error: "Player was just claimed by someone else" }, 409);
  }

  const roundCount = await countPlayerRounds(c.env.DB, playerId);
  const row = await c.env.DB.prepare(
    "SELECT id, name, created_at, claimed_by_user_id FROM players WHERE id = ?",
  )
    .bind(playerId)
    .first<PlayerRow>();

  return c.json(serializePlayer(row!, roundCount));
});
