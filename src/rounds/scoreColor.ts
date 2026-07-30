export type ScoreOutcome = "birdie" | "par" | "bogey";

// Eagles and better fall under "birdie" (still green), double-bogeys and
// worse fall under "bogey" (still amber) — a 3-bucket system matching the
// existing Birdie/Par/Bogey quick-score buttons rather than new tiers.
export function scoreOutcome(strokes: number, par: number): ScoreOutcome {
  if (strokes < par) {
    return "birdie";
  }
  if (strokes > par) {
    return "bogey";
  }
  return "par";
}
