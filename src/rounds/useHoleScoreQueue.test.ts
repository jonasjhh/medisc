import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import * as holeScoreQueue from "./holeScoreQueue";
import {
  useHoleScoreQueueSync,
  useQueuedHoleScoreCount,
} from "./useHoleScoreQueue";

vi.mock("./holeScoreQueue");

describe("useQueuedHoleScoreCount", () => {
  it("reads the count on mount", async () => {
    vi.mocked(holeScoreQueue.getQueuedHoleScoreCount).mockResolvedValue(2);
    const { result } = renderHook(() => useQueuedHoleScoreCount());
    await waitFor(() => expect(result.current).toBe(2));
  });

  it("re-reads the count when the queue-changed event fires", async () => {
    vi.mocked(holeScoreQueue.getQueuedHoleScoreCount)
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(3);
    const { result } = renderHook(() => useQueuedHoleScoreCount());
    await waitFor(() => expect(result.current).toBe(1));

    act(() => {
      window.dispatchEvent(new Event("medisc:hole-score-queue-changed"));
    });

    await waitFor(() => expect(result.current).toBe(3));
  });
});

describe("useHoleScoreQueueSync", () => {
  it("drains the queue on mount", () => {
    renderHook(() => useHoleScoreQueueSync());
    expect(holeScoreQueue.drainHoleScoreQueue).toHaveBeenCalledTimes(1);
  });

  it("drains the queue again when the browser comes back online", () => {
    renderHook(() => useHoleScoreQueueSync());
    expect(holeScoreQueue.drainHoleScoreQueue).toHaveBeenCalledTimes(1);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(holeScoreQueue.drainHoleScoreQueue).toHaveBeenCalledTimes(2);
  });
});
