import { updateHoleScore } from "./api";

// Persisted so queued edits survive a closed tab/app restart while offline
// mid-round — the whole point is a lost signal can outlast the page.
const DB_NAME = "medisc-write-queue";
const STORE_NAME = "holeScoreUpdates";
const DB_VERSION = 1;

export interface QueuedHoleScoreUpdate {
  holeScoreId: number;
  strokes?: number;
  penalties?: number;
}

// Cached rather than reopened per call: an unclosed connection blocks
// indexedDB.deleteDatabase() (used by tests), and there's no reason to pay
// the open cost on every read/write in normal use either.
let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: "holeScoreId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error as Error);
    };
  });
  return dbPromise;
}

// Test-only: closes the cached connection so indexedDB.deleteDatabase() can
// run between tests without blocking.
export async function closeHoleScoreQueueDbForTests(): Promise<void> {
  if (!dbPromise) {
    return;
  }
  const db = await dbPromise;
  db.close();
  dbPromise = null;
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error as Error);
  });
}

// Notifies same-tab listeners (the offline banner's pending count) that the
// queue changed — a plain window event rather than React context, since the
// banner and the score-adjusting code live in unrelated parts of the tree.
function notifyChanged() {
  window.dispatchEvent(new Event("medisc:hole-score-queue-changed"));
}

// Callers always pass one field at a time (a single +/- tap), so a naive
// overwrite-by-key would drop an earlier queued field. Merge onto whatever's
// already queued for this hole score instead. Read and write use separate
// transactions — simpler than keeping one transaction alive across an
// awaited request, and safe here since this queue has a single writer.
export async function enqueueHoleScoreUpdate(
  holeScoreId: number,
  patch: { strokes?: number; penalties?: number },
): Promise<void> {
  const db = await openDb();
  const existing = await requestToPromise<QueuedHoleScoreUpdate | undefined>(
    db
      .transaction(STORE_NAME, "readonly")
      .objectStore(STORE_NAME)
      .get(holeScoreId),
  );
  await requestToPromise(
    db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put({ ...existing, ...patch, holeScoreId }),
  );
  notifyChanged();
}

export async function getQueuedHoleScoreUpdates(): Promise<
  QueuedHoleScoreUpdate[]
> {
  const db = await openDb();
  return requestToPromise(
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll(),
  );
}

export async function getQueuedHoleScoreCount(): Promise<number> {
  const db = await openDb();
  return requestToPromise(
    db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).count(),
  );
}

async function dequeueHoleScoreUpdate(holeScoreId: number): Promise<void> {
  const db = await openDb();
  await requestToPromise(
    db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .delete(holeScoreId),
  );
  notifyChanged();
}

let draining = false;

// Replays queued edits against the real API, oldest first. Stops at the
// first network failure (further entries would fail the same way right
// now) but drops entries the server outright rejects, rather than retrying
// something that can never succeed.
export async function drainHoleScoreQueue(): Promise<number> {
  if (draining) {
    return 0;
  }
  draining = true;
  try {
    const queued = await getQueuedHoleScoreUpdates();
    let synced = 0;
    for (const { holeScoreId, ...patch } of queued) {
      try {
        await updateHoleScore(holeScoreId, patch);
        await dequeueHoleScoreUpdate(holeScoreId);
        synced++;
      } catch (err) {
        if (err instanceof TypeError) {
          break;
        }
        await dequeueHoleScoreUpdate(holeScoreId);
      }
    }
    if (synced > 0) {
      window.dispatchEvent(
        new CustomEvent("medisc:hole-score-queue-synced", {
          detail: { count: synced },
        }),
      );
    }
    return synced;
  } finally {
    draining = false;
  }
}
