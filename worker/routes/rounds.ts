import { Hono } from "hono";
import type { AppEnv } from "../types";
import { createRoundSchema, updateRoundSchema } from "../schemas";
import { parseIntParam } from "../params";
import { fetchWeather } from "../weather";
import {
  roundDetailSchema,
  roundListResponseSchema,
} from "../../shared/contracts/rounds";

interface WeatherColumns {
  temperature_celsius: number | null;
  wind_speed_ms: number | null;
  wind_direction_degrees: number | null;
  weather_symbol_code: string | null;
}

interface RoundRow extends WeatherColumns {
  id: number;
  course_id: number;
  layout_id: number;
  created_at: string;
  completed_at: string | null;
  counting: number;
}

interface RoundListRow extends WeatherColumns {
  id: number;
  created_at: string;
  completed_at: string | null;
  counting: number;
  course_name: string;
  layout_name: string;
}

function weatherFromRow(row: WeatherColumns) {
  if (
    row.temperature_celsius === null ||
    row.wind_speed_ms === null ||
    row.wind_direction_degrees === null
  ) {
    return null;
  }
  return {
    temperatureCelsius: row.temperature_celsius,
    windSpeedMs: row.wind_speed_ms,
    windDirectionDegrees: row.wind_direction_degrees,
    symbolCode: row.weather_symbol_code,
  };
}

interface RoundListPlayerRow {
  round_id: number;
  id: number;
  name: string;
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
  recorded: number;
}

async function buildRoundDetail(db: D1Database, roundId: number) {
  const round = await db
    .prepare(
      `SELECT rounds.id, rounds.course_id, rounds.layout_id, rounds.created_at,
              rounds.completed_at, rounds.counting,
              rounds.temperature_celsius, rounds.wind_speed_ms,
              rounds.wind_direction_degrees, rounds.weather_symbol_code,
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
        "SELECT id, hole_id, player_id, strokes, penalties, recorded FROM hole_scores WHERE round_id = ?",
      )
      .bind(roundId)
      .all<HoleScoreRow>(),
  ]);

  return roundDetailSchema.parse({
    id: round.id,
    createdAt: round.created_at,
    completedAt: round.completed_at,
    counting: Boolean(round.counting),
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
      recorded: Boolean(score.recorded),
    })),
    weather: weatherFromRow(round),
  });
}

async function allPlayersExist(db: D1Database, playerIds: number[]) {
  const placeholders = playerIds.map(() => "?").join(",");
  const { results } = await db
    .prepare(`SELECT id FROM players WHERE id IN (${placeholders})`)
    .bind(...playerIds)
    .all();
  return results.length === playerIds.length;
}

function parScoreInsertStatements(
  db: D1Database,
  roundId: number,
  playerIds: number[],
  holes: { id: number; par: number }[],
) {
  return playerIds.flatMap((playerId) =>
    holes.map((hole) =>
      db
        .prepare(
          `INSERT INTO hole_scores (round_id, player_id, hole_id, strokes, penalties, recorded)
           VALUES (?, ?, ?, ?, 0, 0)`,
        )
        .bind(roundId, playerId, hole.id, hole.par),
    ),
  );
}

export const roundsRoute = new Hono<AppEnv>();

roundsRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createRoundSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  // If this exact request was already submitted (e.g. the client retried
  // after the original response was lost), return the round that was
  // already created instead of creating a duplicate.
  const idempotencyKey = c.req.header("Idempotency-Key") ?? null;
  if (idempotencyKey) {
    const existing = await c.env.DB.prepare(
      "SELECT id FROM rounds WHERE client_request_id = ?",
    )
      .bind(idempotencyKey)
      .first<{ id: number }>();
    if (existing) {
      return c.json(await buildRoundDetail(c.env.DB, existing.id), 200);
    }
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

  if (!(await allPlayersExist(c.env.DB, uniquePlayerIds))) {
    return c.json({ error: "One or more players were not found" }, 404);
  }

  const { results: holes } = await c.env.DB.prepare(
    "SELECT id, par FROM holes WHERE layout_id = ?",
  )
    .bind(layoutId)
    .all<{ id: number; par: number }>();

  const course = await c.env.DB.prepare(
    "SELECT latitude, longitude FROM courses WHERE id = ?",
  )
    .bind(courseId)
    .first<{ latitude: number | null; longitude: number | null }>();
  const weather =
    course?.latitude != null && course.longitude != null
      ? await fetchWeather(course.latitude, course.longitude)
      : null;

  let roundId: number;
  try {
    const round = await c.env.DB.prepare(
      `INSERT INTO rounds
         (course_id, layout_id, client_request_id, temperature_celsius,
          wind_speed_ms, wind_direction_degrees, weather_symbol_code)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING id`,
    )
      .bind(
        courseId,
        layoutId,
        idempotencyKey,
        weather?.temperatureCelsius ?? null,
        weather?.windSpeedMs ?? null,
        weather?.windDirectionDegrees ?? null,
        weather?.symbolCode ?? null,
      )
      .first<{ id: number }>();
    roundId = round!.id;
  } catch (cause) {
    // A concurrent retry with the same key can win the INSERT race; fall
    // back to the round it created instead of surfacing a raw 500.
    if (idempotencyKey) {
      const existing = await c.env.DB.prepare(
        "SELECT id FROM rounds WHERE client_request_id = ?",
      )
        .bind(idempotencyKey)
        .first<{ id: number }>();
      if (existing) {
        return c.json(await buildRoundDetail(c.env.DB, existing.id), 200);
      }
    }
    throw cause;
  }

  const statements = [
    ...uniquePlayerIds.map((playerId) =>
      c.env.DB.prepare(
        "INSERT INTO round_players (round_id, player_id) VALUES (?, ?)",
      ).bind(roundId, playerId),
    ),
    ...parScoreInsertStatements(c.env.DB, roundId, uniquePlayerIds, holes),
  ];
  await c.env.DB.batch(statements);

  const detail = await buildRoundDetail(c.env.DB, roundId);
  return c.json(detail, 201);
});

roundsRoute.get("/", async (c) => {
  const status = c.req.query("status");
  const playerId = c.req.query("playerId");
  const courseId = c.req.query("courseId");

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (status === "completed") {
    conditions.push("rounds.completed_at IS NOT NULL");
  } else if (status === "in_progress") {
    conditions.push("rounds.completed_at IS NULL");
  }

  if (playerId) {
    conditions.push(
      "rounds.id IN (SELECT round_id FROM round_players WHERE player_id = ?)",
    );
    params.push(Number(playerId));
  }

  if (courseId) {
    conditions.push("rounds.course_id = ?");
    params.push(Number(courseId));
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const { results } = await c.env.DB.prepare(
    `SELECT rounds.id, rounds.created_at, rounds.completed_at, rounds.counting,
            rounds.temperature_celsius, rounds.wind_speed_ms,
            rounds.wind_direction_degrees, rounds.weather_symbol_code,
            courses.name AS course_name, layouts.name AS layout_name
     FROM rounds
     JOIN courses ON courses.id = rounds.course_id
     JOIN layouts ON layouts.id = rounds.layout_id
     ${where}
     ORDER BY rounds.created_at DESC`,
  )
    .bind(...params)
    .all<RoundListRow>();

  const playersByRound = new Map<number, { id: number; name: string }[]>();
  if (results.length > 0) {
    const placeholders = results.map(() => "?").join(",");
    const { results: playerRows } = await c.env.DB.prepare(
      `SELECT round_players.round_id AS round_id, players.id, players.name
       FROM round_players
       JOIN players ON players.id = round_players.player_id
       WHERE round_players.round_id IN (${placeholders})
       ORDER BY round_players.round_id, players.name`,
    )
      .bind(...results.map((row) => row.id))
      .all<RoundListPlayerRow>();
    for (const row of playerRows) {
      const players = playersByRound.get(row.round_id) ?? [];
      players.push({ id: row.id, name: row.name });
      playersByRound.set(row.round_id, players);
    }
  }

  return c.json(
    roundListResponseSchema.parse({
      rounds: results.map((row) => ({
        id: row.id,
        createdAt: row.created_at,
        completedAt: row.completed_at,
        counting: Boolean(row.counting),
        courseName: row.course_name,
        layoutName: row.layout_name,
        players: playersByRound.get(row.id) ?? [],
        weather: weatherFromRow(row),
      })),
    }),
  );
});

roundsRoute.get("/:roundId", async (c) => {
  const roundId = parseIntParam(c.req.param("roundId"));
  if (roundId === null) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const detail = await buildRoundDetail(c.env.DB, roundId);
  if (!detail) {
    return c.json({ error: "Round not found" }, 404);
  }

  return c.json(detail);
});

roundsRoute.patch("/:roundId", async (c) => {
  const roundId = parseIntParam(c.req.param("roundId"));
  if (roundId === null) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const body = await c.req.json().catch(() => null);
  const parsed = updateRoundSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const round = await c.env.DB.prepare(
    "SELECT layout_id, completed_at FROM rounds WHERE id = ?",
  )
    .bind(roundId)
    .first<{ layout_id: number; completed_at: string | null }>();
  if (!round) {
    return c.json({ error: "Round not found" }, 404);
  }

  const { playerIds, counting } = parsed.data;

  if (playerIds !== undefined) {
    if (round.completed_at) {
      return c.json(
        { error: "Cannot change players on a completed round" },
        409,
      );
    }

    const uniquePlayerIds = [...new Set(playerIds)];
    if (!(await allPlayersExist(c.env.DB, uniquePlayerIds))) {
      return c.json({ error: "One or more players were not found" }, 404);
    }

    const { results: currentPlayers } = await c.env.DB.prepare(
      "SELECT player_id FROM round_players WHERE round_id = ?",
    )
      .bind(roundId)
      .all<{ player_id: number }>();
    const currentIds = new Set(currentPlayers.map((row) => row.player_id));
    const desiredIds = new Set(uniquePlayerIds);

    const toRemove = [...currentIds].filter((id) => !desiredIds.has(id));
    const toAdd = [...desiredIds].filter((id) => !currentIds.has(id));

    const { results: holes } = await c.env.DB.prepare(
      "SELECT id, par FROM holes WHERE layout_id = ?",
    )
      .bind(round.layout_id)
      .all<{ id: number; par: number }>();

    const statements = [
      ...toRemove.map((playerId) =>
        c.env.DB.prepare(
          "DELETE FROM hole_scores WHERE round_id = ? AND player_id = ?",
        ).bind(roundId, playerId),
      ),
      ...toRemove.map((playerId) =>
        c.env.DB.prepare(
          "DELETE FROM round_players WHERE round_id = ? AND player_id = ?",
        ).bind(roundId, playerId),
      ),
      ...toAdd.map((playerId) =>
        c.env.DB.prepare(
          "INSERT INTO round_players (round_id, player_id) VALUES (?, ?)",
        ).bind(roundId, playerId),
      ),
      ...parScoreInsertStatements(c.env.DB, roundId, toAdd, holes),
    ];
    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }
  }

  if (counting !== undefined) {
    if (round.completed_at) {
      return c.json(
        { error: "Cannot change counting on a completed round" },
        409,
      );
    }
    await c.env.DB.prepare("UPDATE rounds SET counting = ? WHERE id = ?")
      .bind(counting ? 1 : 0, roundId)
      .run();
  }

  const detail = await buildRoundDetail(c.env.DB, roundId);
  return c.json(detail);
});

roundsRoute.post("/:roundId/complete", async (c) => {
  const roundId = parseIntParam(c.req.param("roundId"));
  if (roundId === null) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE id = ?")
    .bind(roundId)
    .first();
  if (!round) {
    return c.json({ error: "Round not found" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE rounds SET completed_at = datetime('now') WHERE id = ?",
  )
    .bind(roundId)
    .run();

  // Holes nobody ever touched stay unrecorded even after finishing — a
  // completed round's totals only ever reflect scores someone actually
  // entered, never a silently-assumed par.
  const detail = await buildRoundDetail(c.env.DB, roundId);
  return c.json(detail);
});

roundsRoute.delete("/:roundId", async (c) => {
  const roundId = parseIntParam(c.req.param("roundId"));
  if (roundId === null) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE id = ?")
    .bind(roundId)
    .first();
  if (!round) {
    return c.json({ error: "Round not found" }, 404);
  }

  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM hole_scores WHERE round_id = ?").bind(
      roundId,
    ),
    c.env.DB.prepare("DELETE FROM round_players WHERE round_id = ?").bind(
      roundId,
    ),
    c.env.DB.prepare("DELETE FROM rounds WHERE id = ?").bind(roundId),
  ]);

  return c.body(null, 204);
});

roundsRoute.post("/:roundId/reopen", async (c) => {
  const roundId = parseIntParam(c.req.param("roundId"));
  if (roundId === null) {
    return c.json({ error: "Invalid round id" }, 400);
  }

  const round = await c.env.DB.prepare("SELECT id FROM rounds WHERE id = ?")
    .bind(roundId)
    .first();
  if (!round) {
    return c.json({ error: "Round not found" }, 404);
  }

  await c.env.DB.prepare("UPDATE rounds SET completed_at = NULL WHERE id = ?")
    .bind(roundId)
    .run();

  const detail = await buildRoundDetail(c.env.DB, roundId);
  return c.json(detail);
});
