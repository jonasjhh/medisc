import { Hono } from "hono";
import type { AppEnv } from "../types";
import { createPlayerSchema, updatePlayerSchema } from "../schemas";
import { parseIntParam } from "../params";
import {
  holeBreakdownResponseSchema,
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

interface HoleRow {
  id: number;
  number: number;
  par: number;
  distance_meters: number | null;
  layout_id: number;
  layout_name: string;
  course_name: string;
}

interface HoleThrowRow {
  round_id: number;
  date: string;
  strokes: number;
  penalties: number;
}

// Mirrors src/rounds/scoreColor.ts's scoreOutcome().
const SCORE_BUCKET_CASE = `CASE
           WHEN hole_scores.strokes = 1 THEN 'ace'
           WHEN hole_scores.strokes <= holes.par - 3 THEN 'albatross'
           WHEN hole_scores.strokes = holes.par - 2 THEN 'eagle'
           WHEN hole_scores.strokes = holes.par - 1 THEN 'birdie'
           WHEN hole_scores.strokes = holes.par THEN 'par'
           WHEN hole_scores.strokes = holes.par + 1 THEN 'bogey'
           WHEN hole_scores.strokes = holes.par + 2 THEN 'doubleBogey'
           ELSE 'worse'
         END`;

function emptyDistribution(): ScoreDistribution {
  return {
    ace: 0,
    albatross: 0,
    eagle: 0,
    birdie: 0,
    par: 0,
    bogey: 0,
    doubleBogey: 0,
    worse: 0,
  };
}

// Undefined means "no filter given" (the field is everyone). An explicit,
// possibly-empty list means the caller has chosen exactly who's in the
// field, including choosing nobody.
function parsePlayerIdsParam(raw: string | undefined): number[] | null {
  if (raw === undefined) {
    return null;
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
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

  const { results } = await c.env.DB.prepare(
    `SELECT ${SCORE_BUCKET_CASE} AS bucket, COUNT(*) AS count
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
    ...emptyDistribution(),
  };
  for (const row of results) {
    distribution[row.bucket] = row.count;
  }

  return c.json(scoreDistributionResponseSchema.parse({ distribution }));
});

playersRoute.get("/:playerId/holes/:holeId/breakdown", async (c) => {
  const playerId = parseIntParam(c.req.param("playerId"));
  const holeId = parseIntParam(c.req.param("holeId"));
  if (playerId === null || holeId === null) {
    return c.json({ error: "Invalid id" }, 400);
  }

  const player = await c.env.DB.prepare("SELECT id FROM players WHERE id = ?")
    .bind(playerId)
    .first();
  if (!player) {
    return c.json({ error: "Player not found" }, 404);
  }

  const hole = await c.env.DB.prepare(
    `SELECT holes.id, holes.number, holes.par, holes.distance_meters,
            holes.layout_id, layouts.name AS layout_name, courses.name AS course_name
     FROM holes
     JOIN layouts ON layouts.id = holes.layout_id
     JOIN courses ON courses.id = layouts.course_id
     WHERE holes.id = ?`,
  )
    .bind(holeId)
    .first<HoleRow>();
  if (!hole) {
    return c.json({ error: "Hole not found" }, 404);
  }

  // undefined fieldPlayerIds means no filter given (the field is everyone);
  // an explicit, possibly-empty list means the caller chose exactly who's
  // in the field, including choosing nobody.
  const fieldPlayerIds = parsePlayerIdsParam(c.req.query("fieldPlayerIds"));
  const fieldFilterSql =
    fieldPlayerIds === null
      ? ""
      : fieldPlayerIds.length === 0
        ? "AND 0 = 1"
        : `AND hole_scores.player_id IN (${fieldPlayerIds.map(() => "?").join(", ")})`;
  const fieldFilterBinds = fieldPlayerIds ?? [];

  // Only rounds that count and are actually finished, and only strokes the
  // player explicitly entered (see TotalsList.tsx's same rule) — a hole
  // nobody touched shouldn't pad any average with its seeded default.
  const [
    { results: playerBucketRows },
    { results: throwRows },
    { results: fieldBucketRows },
    fieldAvgRow,
  ] = await Promise.all([
    c.env.DB.prepare(
      `SELECT ${SCORE_BUCKET_CASE} AS bucket, COUNT(*) AS count
         FROM hole_scores
         JOIN rounds ON rounds.id = hole_scores.round_id
         JOIN holes ON holes.id = hole_scores.hole_id
         WHERE hole_scores.player_id = ?
           AND hole_scores.hole_id = ?
           AND hole_scores.recorded = 1
           AND rounds.completed_at IS NOT NULL
           AND rounds.counting = 1
         GROUP BY bucket`,
    )
      .bind(playerId, holeId)
      .all<ScoreBucketRow>(),
    c.env.DB.prepare(
      `SELECT hole_scores.round_id,
                COALESCE(rounds.completed_at, rounds.created_at) AS date,
                hole_scores.strokes, hole_scores.penalties
         FROM hole_scores
         JOIN rounds ON rounds.id = hole_scores.round_id
         WHERE hole_scores.player_id = ?
           AND hole_scores.hole_id = ?
           AND hole_scores.recorded = 1
           AND rounds.completed_at IS NOT NULL
           AND rounds.counting = 1
         ORDER BY date DESC`,
    )
      .bind(playerId, holeId)
      .all<HoleThrowRow>(),
    c.env.DB.prepare(
      `SELECT ${SCORE_BUCKET_CASE} AS bucket, COUNT(*) AS count
         FROM hole_scores
         JOIN rounds ON rounds.id = hole_scores.round_id
         JOIN holes ON holes.id = hole_scores.hole_id
         WHERE hole_scores.hole_id = ?
           AND hole_scores.recorded = 1
           AND rounds.completed_at IS NOT NULL
           AND rounds.counting = 1
           ${fieldFilterSql}
         GROUP BY bucket`,
    )
      .bind(holeId, ...fieldFilterBinds)
      .all<ScoreBucketRow>(),
    c.env.DB.prepare(
      `SELECT AVG(hole_scores.strokes) AS avg_strokes
         FROM hole_scores
         JOIN rounds ON rounds.id = hole_scores.round_id
         WHERE hole_scores.hole_id = ?
           AND hole_scores.recorded = 1
           AND rounds.completed_at IS NOT NULL
           AND rounds.counting = 1
           ${fieldFilterSql}`,
    )
      .bind(holeId, ...fieldFilterBinds)
      .first<{ avg_strokes: number | null }>(),
  ]);

  const playerDistribution = emptyDistribution();
  for (const row of playerBucketRows) {
    playerDistribution[row.bucket] = row.count;
  }

  const fieldDistribution = emptyDistribution();
  for (const row of fieldBucketRows) {
    fieldDistribution[row.bucket] = row.count;
  }

  const playerAvgStrokes =
    throwRows.length > 0
      ? throwRows.reduce((sum, row) => sum + row.strokes, 0) / throwRows.length
      : null;

  return c.json(
    holeBreakdownResponseSchema.parse({
      breakdown: {
        hole: {
          id: hole.id,
          number: hole.number,
          par: hole.par,
          distanceMeters: hole.distance_meters,
          layoutId: hole.layout_id,
          layoutName: hole.layout_name,
          courseName: hole.course_name,
        },
        playerDistribution,
        fieldDistribution,
        throws: throwRows.map((row) => ({
          roundId: row.round_id,
          date: row.date,
          strokes: row.strokes,
          penalties: row.penalties,
        })),
        playerAvgStrokes,
        fieldAvgStrokes: fieldAvgRow?.avg_strokes ?? null,
      },
    }),
  );
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
