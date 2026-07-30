import { Hono } from "hono";
import type { Env } from "../types";

interface TopScoreRow {
  user_id: string;
  total_score: number;
  visits: number;
}

export const scoresRoute = new Hono<{ Bindings: Env }>();

scoresRoute.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const userId =
    body && typeof body.userId === "string" ? body.userId.trim() : "";
  const score = body && typeof body.score === "number" ? body.score : NaN;

  if (!userId || !Number.isFinite(score)) {
    return c.json(
      { error: "userId (string) and score (number) are required" },
      400,
    );
  }

  await c.env.DB.prepare("INSERT INTO scores (user_id, score) VALUES (?, ?)")
    .bind(userId, score)
    .run();

  const [totalRow, userRow] = await Promise.all([
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM scores").first<{
      count: number;
    }>(),
    c.env.DB.prepare("SELECT COUNT(*) AS count FROM scores WHERE user_id = ?")
      .bind(userId)
      .first<{ count: number }>(),
  ]);

  return c.json({
    totalVisits: totalRow?.count ?? 0,
    yourVisits: userRow?.count ?? 0,
  });
});

scoresRoute.get("/top", async (c) => {
  const limitParam = c.req.query("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);

  const { results } = await c.env.DB.prepare(
    `SELECT user_id, SUM(score) AS total_score, COUNT(*) AS visits
     FROM scores
     GROUP BY user_id
     ORDER BY total_score DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all<TopScoreRow>();

  return c.json({
    scores: results.map((row) => ({
      userId: row.user_id,
      totalScore: row.total_score,
      visits: row.visits,
    })),
  });
});
