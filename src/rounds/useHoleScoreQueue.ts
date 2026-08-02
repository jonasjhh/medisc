import { useEffect, useState } from "react";
import { drainHoleScoreQueue, getQueuedHoleScoreCount } from "./holeScoreQueue";

export function useQueuedHoleScoreCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void getQueuedHoleScoreCount().then((next) => {
        if (!cancelled) {
          setCount(next);
        }
      });
    };
    refresh();
    window.addEventListener("medisc:hole-score-queue-changed", refresh);
    return () => {
      cancelled = true;
      window.removeEventListener("medisc:hole-score-queue-changed", refresh);
    };
  }, []);

  return count;
}

// Mounted once at the app root: replays any queued edits on load (in case
// the tab was closed while offline) and again whenever the browser regains
// connectivity.
export function useHoleScoreQueueSync() {
  useEffect(() => {
    void drainHoleScoreQueue();
    const handleOnline = () => void drainHoleScoreQueue();
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, []);
}
