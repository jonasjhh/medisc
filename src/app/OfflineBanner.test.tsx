import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "./OfflineBanner";
import {
  closeHoleScoreQueueDbForTests,
  enqueueHoleScoreUpdate,
} from "../rounds/holeScoreQueue";

function setNavigatorOnLine(value: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
}

async function deleteQueueDb(): Promise<void> {
  await closeHoleScoreQueueDbForTests();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase("medisc-write-queue");
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error as Error);
    request.onblocked = () => resolve();
  });
}

describe("OfflineBanner", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await deleteQueueDb();
  });

  it("renders nothing while online", () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a warning while offline", async () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/you're offline/i),
    );
  });

  it("appears when connectivity drops and clears when it returns", async () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/you're offline/i),
    );

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the number of scores queued while offline", async () => {
    await enqueueHoleScoreUpdate(10, { strokes: 4 });
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent("1 score queued."),
    );
  });
});
