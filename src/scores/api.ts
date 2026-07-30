export interface VisitStats {
  totalVisits: number;
  yourVisits: number;
}

export interface TopScoreEntry {
  userId: string;
  totalScore: number;
  visits: number;
}

// Records one row in the D1 `scores` table for this visit and returns the
// updated totals, so a page load doubles as the "save a score" action.
export async function recordVisit(userId: string): Promise<VisitStats> {
  const response = await fetch("/api/scores", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId, score: 1 }),
  });

  if (!response.ok) {
    throw new Error(`Failed to record visit: ${response.status}`);
  }

  return response.json();
}

export async function fetchTopScores(limit = 10): Promise<TopScoreEntry[]> {
  const response = await fetch(`/api/scores/top?limit=${limit}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch top scores: ${response.status}`);
  }

  const data: { scores: TopScoreEntry[] } = await response.json();
  return data.scores;
}
