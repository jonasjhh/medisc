import { useEffect, useState } from "react";
import { getOrCreateUserId } from "../storage/userId";
import { fetchTopScores, recordVisit } from "./api";
import type { TopScoreEntry, VisitStats } from "./api";

type Status = "loading" | "ready" | "error";

export interface VisitTrackingState {
  status: Status;
  error: string | null;
  stats: VisitStats | null;
  topScores: TopScoreEntry[];
}

// Records the current page load as a visit against the Worker/D1 API, then
// loads the leaderboard so it reflects that just-recorded visit.
export function useVisitTracking(): VisitTrackingState {
  const [state, setState] = useState<VisitTrackingState>({
    status: "loading",
    error: null,
    stats: null,
    topScores: [],
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const userId = await getOrCreateUserId();
        const stats = await recordVisit(userId);
        const topScores = await fetchTopScores();
        if (!cancelled) {
          setState({ status: "ready", error: null, stats, topScores });
        }
      } catch (err) {
        if (!cancelled) {
          setState({
            status: "error",
            error: err instanceof Error ? err.message : "Unknown error",
            stats: null,
            topScores: [],
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
