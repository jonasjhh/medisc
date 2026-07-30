import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ScoreBoard } from "./ScoreBoard";
import { useVisitTracking } from "./useVisitTracking";

vi.mock("./useVisitTracking");

describe("ScoreBoard", () => {
  it("shows visit stats and the leaderboard once loaded", () => {
    vi.mocked(useVisitTracking).mockReturnValue({
      status: "ready",
      error: null,
      stats: { totalVisits: 10, yourVisits: 4 },
      topScores: [{ userId: "abcdef1234", totalScore: 4, visits: 4 }],
    });

    render(<ScoreBoard />);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText(/abcdef12/)).toBeInTheDocument();
  });

  it("shows an error state when the API call fails", () => {
    vi.mocked(useVisitTracking).mockReturnValue({
      status: "error",
      error: "network down",
      stats: null,
      topScores: [],
    });

    render(<ScoreBoard />);

    expect(screen.getByText(/network down/i)).toBeInTheDocument();
  });
});
