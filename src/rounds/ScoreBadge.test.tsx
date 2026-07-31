import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBadge } from "./ScoreBadge";

describe("ScoreBadge", () => {
  it("shows the stroke count for a birdie", () => {
    render(<ScoreBadge strokes={2} par={3} />);

    expect(screen.getByTestId("score-badge")).toHaveTextContent("2");
  });

  it("shows the stroke count for a par", () => {
    render(<ScoreBadge strokes={3} par={3} />);

    expect(screen.getByTestId("score-badge")).toHaveTextContent("3");
  });

  it("shows the stroke count for a bogey", () => {
    render(<ScoreBadge strokes={4} par={3} />);

    expect(screen.getByTestId("score-badge")).toHaveTextContent("4");
  });

  it("shows a dash when the score hasn't been recorded yet", () => {
    render(<ScoreBadge strokes={3} par={3} recorded={false} />);

    expect(screen.getByTestId("score-badge")).toHaveTextContent("-");
  });
});
