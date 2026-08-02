import { afterEach, describe, expect, it, vi } from "vitest";
import * as api from "./api";
import {
  closeHoleScoreQueueDbForTests,
  drainHoleScoreQueue,
  enqueueHoleScoreUpdate,
  getQueuedHoleScoreCount,
  getQueuedHoleScoreUpdates,
} from "./holeScoreQueue";

vi.mock("./api");

async function deleteDb(): Promise<void> {
  await closeHoleScoreQueueDbForTests();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("medisc-write-queue");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error as Error);
    request.onblocked = () => resolve();
  });
}

describe("holeScoreQueue", () => {
  afterEach(async () => {
    await deleteDb();
  });

  it("enqueues an update and lists it", async () => {
    await enqueueHoleScoreUpdate(10, { strokes: 4 });
    const queued = await getQueuedHoleScoreUpdates();
    expect(queued).toEqual([{ holeScoreId: 10, strokes: 4 }]);
    expect(await getQueuedHoleScoreCount()).toBe(1);
  });

  it("merges a second partial update onto the same hole score", async () => {
    await enqueueHoleScoreUpdate(10, { strokes: 4 });
    await enqueueHoleScoreUpdate(10, { penalties: 1 });
    const queued = await getQueuedHoleScoreUpdates();
    expect(queued).toEqual([{ holeScoreId: 10, strokes: 4, penalties: 1 }]);
  });

  it("keeps only the latest value when the same field is queued twice", async () => {
    await enqueueHoleScoreUpdate(10, { strokes: 4 });
    await enqueueHoleScoreUpdate(10, { strokes: 5 });
    const queued = await getQueuedHoleScoreUpdates();
    expect(queued).toEqual([{ holeScoreId: 10, strokes: 5 }]);
  });

  it("drains successfully-synced entries and dispatches a synced event", async () => {
    vi.mocked(api.updateHoleScore).mockResolvedValue({
      id: 10,
      roundId: 1,
      holeId: 100,
      playerId: 1,
      strokes: 4,
      penalties: 0,
      recorded: true,
    });
    await enqueueHoleScoreUpdate(10, { strokes: 4 });

    const synced = vi.fn();
    window.addEventListener("medisc:hole-score-queue-synced", synced);

    const count = await drainHoleScoreQueue();

    expect(count).toBe(1);
    expect(api.updateHoleScore).toHaveBeenCalledWith(10, { strokes: 4 });
    expect(await getQueuedHoleScoreCount()).toBe(0);
    expect(synced).toHaveBeenCalledTimes(1);
    window.removeEventListener("medisc:hole-score-queue-synced", synced);
  });

  it("stops draining and leaves entries queued on a network failure", async () => {
    vi.mocked(api.updateHoleScore).mockRejectedValue(
      new TypeError("Failed to fetch"),
    );
    await enqueueHoleScoreUpdate(10, { strokes: 4 });
    await enqueueHoleScoreUpdate(11, { strokes: 3 });

    const count = await drainHoleScoreQueue();

    expect(count).toBe(0);
    expect(await getQueuedHoleScoreCount()).toBe(2);
  });

  it("drops an entry the server rejects outright, without retrying it", async () => {
    vi.mocked(api.updateHoleScore).mockRejectedValue(
      new Error("Round not found"),
    );
    await enqueueHoleScoreUpdate(10, { strokes: 4 });

    const count = await drainHoleScoreQueue();

    expect(count).toBe(0);
    expect(await getQueuedHoleScoreCount()).toBe(0);
  });
});
