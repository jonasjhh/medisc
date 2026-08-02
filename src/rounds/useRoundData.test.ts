import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import { useRoundData } from "./useRoundData";
import * as roundsApi from "./api";
import {
  closeHoleScoreQueueDbForTests,
  getQueuedHoleScoreUpdates,
} from "./holeScoreQueue";

vi.mock("./api");

async function deleteQueueDb(): Promise<void> {
  await closeHoleScoreQueueDbForTests();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("medisc-write-queue");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error as Error);
    request.onblocked = () => resolve();
  });
}

const baseRound: roundsApi.RoundDetail = {
  id: 1,
  createdAt: "",
  completedAt: null,
  counting: true,
  course: { id: 1, name: "Maple Hill" },
  layout: { id: 10, name: "Blue" },
  holes: [{ id: 100, number: 1, par: 3, distanceMeters: 90 }],
  players: [{ id: 1, name: "Alice" }],
  scores: [
    {
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 3,
      penalties: 0,
      recorded: true,
    },
  ],
  weather: null,
};

describe("useRoundData", () => {
  beforeEach(() => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(baseRound);
  });

  afterEach(async () => {
    await deleteQueueDb();
  });

  it("loads the round and reports ready", async () => {
    const { result } = renderHook(() => useRoundData(1));

    expect(result.current.status).toBe("loading");
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.round).toEqual(baseRound);
  });

  it("reports an error status when the initial load fails", async () => {
    vi.mocked(roundsApi.getRound).mockRejectedValue(new Error("not found"));
    const { result } = renderHook(() => useRoundData(1));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("not found");
  });

  it("saves a score optimistically and clears any prior error", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockResolvedValue({
      ...baseRound.scores[0],
      roundId: baseRound.id,
      strokes: 4,
    });
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setScore(1000, "strokes", 4);
    });

    expect(result.current.round?.scores[0].strokes).toBe(4);
    expect(roundsApi.updateHoleScore).toHaveBeenCalledWith(1000, {
      strokes: 4,
    });
  });

  it("rolls back to the server's state and shows an error when saving a score fails", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockRejectedValue(
      new Error("save failed"),
    );
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setScore(1000, "strokes", 4);
    });

    expect(result.current.error).toBe("save failed");
    // refresh() re-fetches, so the optimistic update is replaced by the
    // server's (unchanged) copy of the round.
    expect(roundsApi.getRound).toHaveBeenCalledTimes(2);
    expect(result.current.round?.scores[0].strokes).toBe(3);
  });

  it("keeps the optimistic value and queues the update when offline", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.setScore(1000, "strokes", 4);
    });

    expect(result.current.round?.scores[0].strokes).toBe(4);
    expect(result.current.error).toBeNull();
    // A network failure shouldn't trigger the error-path refresh().
    expect(roundsApi.getRound).toHaveBeenCalledTimes(1);
    expect(await getQueuedHoleScoreUpdates()).toEqual([
      { holeScoreId: 1000, strokes: 4 },
    ]);
  });

  it("adjust() never lets strokes drop below 1", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockResolvedValue({
      ...baseRound.scores[0],
      roundId: baseRound.id,
      strokes: 1,
    });
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.adjust(1000, "strokes", -99);
    });

    expect(roundsApi.updateHoleScore).toHaveBeenCalledWith(1000, {
      strokes: 1,
    });
  });

  it("finishes a round", async () => {
    const completed = { ...baseRound, completedAt: "2026-01-01" };
    vi.mocked(roundsApi.completeRound).mockResolvedValue(completed);
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleFinish();
    });

    expect(result.current.round?.completedAt).toBe("2026-01-01");
    expect(result.current.finishing).toBe(false);
  });

  it("shows an error and resets the finishing flag when finishing fails", async () => {
    vi.mocked(roundsApi.completeRound).mockRejectedValue(
      new Error("finish failed"),
    );
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleFinish();
    });

    expect(result.current.error).toBe("finish failed");
    expect(result.current.finishing).toBe(false);
  });

  it("reopens a round", async () => {
    const reopened = { ...baseRound, completedAt: null };
    vi.mocked(roundsApi.reopenRound).mockResolvedValue(reopened);
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleReopen();
    });

    expect(roundsApi.reopenRound).toHaveBeenCalledWith(1);
    expect(result.current.reopening).toBe(false);
  });

  it("shows an error and resets the reopening flag when reopening fails", async () => {
    vi.mocked(roundsApi.reopenRound).mockRejectedValue(
      new Error("reopen failed"),
    );
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleReopen();
    });

    expect(result.current.error).toBe("reopen failed");
    expect(result.current.reopening).toBe(false);
  });

  it("toggles the counting flag", async () => {
    const updated = { ...baseRound, counting: false };
    vi.mocked(roundsApi.updateRound).mockResolvedValue(updated);
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleToggleCounting();
    });

    expect(roundsApi.updateRound).toHaveBeenCalledWith(1, {
      counting: false,
    });
    expect(result.current.round?.counting).toBe(false);
    expect(result.current.togglingCounting).toBe(false);
  });

  it("shows an error and resets the toggling flag when toggling counting fails", async () => {
    vi.mocked(roundsApi.updateRound).mockRejectedValue(
      new Error("toggle failed"),
    );
    const { result } = renderHook(() => useRoundData(1));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => {
      await result.current.handleToggleCounting();
    });

    expect(result.current.error).toBe("toggle failed");
    expect(result.current.togglingCounting).toBe(false);
  });

  it("does nothing when toggling counting before the round has loaded", async () => {
    const { result } = renderHook(() => useRoundData(1));

    await act(async () => {
      await result.current.handleToggleCounting();
    });

    expect(roundsApi.updateRound).not.toHaveBeenCalled();
  });
});
