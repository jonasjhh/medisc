import { useCallback, useEffect, useState } from "react";
import {
  completeRound,
  getRound,
  reopenRound,
  updateHoleScore,
  updateRound,
} from "./api";
import type { RoundDetail } from "./api";
import { enqueueHoleScoreUpdate } from "./holeScoreQueue";
import type { Status } from "../shared/status";

export type Field = "strokes" | "penalties";

export function useRoundData(id: number) {
  const [round, setRound] = useState<RoundDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [togglingCounting, setTogglingCounting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const detail = await getRound(id);
      setRound(detail);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load round");
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setScore = async (scoreId: number, field: Field, nextValue: number) => {
    if (!round) {
      return;
    }
    const current = round.scores.find((score) => score.id === scoreId);
    if (!current || (current.recorded && current[field] === nextValue)) {
      return;
    }

    setRound({
      ...round,
      scores: round.scores.map((score) =>
        score.id === scoreId
          ? { ...score, [field]: nextValue, recorded: true }
          : score,
      ),
    });

    try {
      await updateHoleScore(scoreId, { [field]: nextValue });
    } catch (err) {
      if (err instanceof TypeError) {
        // Offline: the tap is real input, not a mistake, so keep the
        // optimistic value on screen and replay it once back in range
        // instead of reverting it and showing a scary error.
        await enqueueHoleScoreUpdate(scoreId, { [field]: nextValue });
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to save score");
      await refresh();
    }
  };

  const adjust = (scoreId: number, field: Field, delta: number) => {
    if (!round) {
      return;
    }
    const current = round.scores.find((score) => score.id === scoreId);
    if (!current) {
      return;
    }
    const floor = field === "strokes" ? 1 : 0;
    return setScore(scoreId, field, Math.max(floor, current[field] + delta));
  };

  const handleFinish = async () => {
    setFinishing(true);
    setError(null);
    try {
      const updated = await completeRound(id);
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish round");
    } finally {
      setFinishing(false);
    }
  };

  const handleReopen = async () => {
    setReopening(true);
    setError(null);
    try {
      const updated = await reopenRound(id);
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen round");
    } finally {
      setReopening(false);
    }
  };

  const handleToggleCounting = async () => {
    if (!round) {
      return;
    }
    setTogglingCounting(true);
    setError(null);
    try {
      const updated = await updateRound(id, { counting: !round.counting });
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update round");
    } finally {
      setTogglingCounting(false);
    }
  };

  return {
    round,
    status,
    error,
    setRound,
    setError,
    finishing,
    reopening,
    togglingCounting,
    setScore,
    adjust,
    handleFinish,
    handleReopen,
    handleToggleCounting,
  };
}
