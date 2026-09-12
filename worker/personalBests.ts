export interface PersonalBestRound {
  roundId: number;
  achievedAt: string;
  totalStrokes: number;
  totalPar: number;
}

// The best (lowest-total) fully-recorded, completed, counting round a
// player has on a layout — optionally excluding one round, so a
// just-finished round can ask "what was my best *before* this one?"
// A round only counts if every hole on the layout has a recorded score
// for this player (HAVING clause below) — a partially-scored round
// isn't a fair "best round" comparison.
export async function getBestForLayout(
  db: D1Database,
  playerId: number,
  layoutId: number,
  excludeRoundId?: number,
): Promise<PersonalBestRound | null> {
  const exclude = excludeRoundId !== undefined ? "AND rounds.id != ?" : "";
  const row = await db
    .prepare(
      `SELECT rounds.id AS round_id, rounds.created_at,
              SUM(hole_scores.strokes) AS total_strokes,
              SUM(holes.par) AS total_par,
              COUNT(*) AS holes_scored
       FROM hole_scores
       JOIN rounds ON rounds.id = hole_scores.round_id
       JOIN holes ON holes.id = hole_scores.hole_id
       WHERE hole_scores.player_id = ?
         AND hole_scores.recorded = 1
         AND rounds.layout_id = ?
         AND rounds.completed_at IS NOT NULL
         AND rounds.counting = 1
         ${exclude}
       GROUP BY rounds.id
       HAVING holes_scored = (SELECT COUNT(*) FROM holes WHERE layout_id = ?)
       ORDER BY total_strokes ASC, rounds.created_at ASC
       LIMIT 1`,
    )
    .bind(
      ...(excludeRoundId !== undefined
        ? [playerId, layoutId, excludeRoundId, layoutId]
        : [playerId, layoutId, layoutId]),
    )
    .first<{
      round_id: number;
      created_at: string;
      total_strokes: number;
      total_par: number;
    }>();
  if (!row) return null;
  return {
    roundId: row.round_id,
    achievedAt: row.created_at,
    totalStrokes: row.total_strokes,
    totalPar: row.total_par,
  };
}
