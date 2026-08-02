import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HoleScoreSyncToast } from "./HoleScoreSyncToast";

function dispatchSynced(count: number) {
  act(() => {
    window.dispatchEvent(
      new CustomEvent("medisc:hole-score-queue-synced", { detail: { count } }),
    );
  });
}

describe("HoleScoreSyncToast", () => {
  it("renders nothing until a sync completes", () => {
    render(<HoleScoreSyncToast />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a confirmation with the synced count", () => {
    render(<HoleScoreSyncToast />);
    dispatchSynced(3);
    expect(
      screen.getByText(/synced 3 scores saved while offline/i),
    ).toBeInTheDocument();
  });

  it("uses singular phrasing for a single synced score", () => {
    render(<HoleScoreSyncToast />);
    dispatchSynced(1);
    expect(
      screen.getByText(/synced 1 score saved while offline/i),
    ).toBeInTheDocument();
  });

  it("dismisses when the alert's close action is clicked", () => {
    render(<HoleScoreSyncToast />);
    dispatchSynced(2);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    act(() => {
      screen.getByRole("button", { name: /close/i }).click();
    });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
