export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
}

interface TopScoreRow {
  user_id: string;
  total_score: number;
  visits: number;
}

function jsonResponse(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  });
}

async function handleSaveScore(request: Request, env: Env): Promise<Response> {
  let body: { userId?: unknown; score?: unknown };
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, { status: 400 });
  }

  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  const score = typeof body.score === "number" ? body.score : NaN;

  if (!userId || !Number.isFinite(score)) {
    return jsonResponse(
      { error: "userId (string) and score (number) are required" },
      { status: 400 },
    );
  }

  await env.DB.prepare("INSERT INTO scores (user_id, score) VALUES (?, ?)")
    .bind(userId, score)
    .run();

  const [totalRow, userRow] = await Promise.all([
    env.DB.prepare("SELECT COUNT(*) AS count FROM scores").first<{
      count: number;
    }>(),
    env.DB.prepare("SELECT COUNT(*) AS count FROM scores WHERE user_id = ?")
      .bind(userId)
      .first<{ count: number }>(),
  ]);

  return jsonResponse({
    totalVisits: totalRow?.count ?? 0,
    yourVisits: userRow?.count ?? 0,
  });
}

async function handleTopScores(request: Request, env: Env): Promise<Response> {
  const limitParam = new URL(request.url).searchParams.get("limit");
  const limit = Math.min(Math.max(Number(limitParam) || 10, 1), 100);

  const { results } = await env.DB.prepare(
    `SELECT user_id, SUM(score) AS total_score, COUNT(*) AS visits
     FROM scores
     GROUP BY user_id
     ORDER BY total_score DESC
     LIMIT ?`,
  )
    .bind(limit)
    .all<TopScoreRow>();

  return jsonResponse({
    scores: results.map((row) => ({
      userId: row.user_id,
      totalScore: row.total_score,
      visits: row.visits,
    })),
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/scores" && request.method === "POST") {
      return handleSaveScore(request, env);
    }

    if (url.pathname === "/api/scores/top" && request.method === "GET") {
      return handleTopScores(request, env);
    }

    if (url.pathname.startsWith("/api/")) {
      return jsonResponse({ error: "Not found" }, { status: 404 });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
