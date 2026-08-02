import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import type { ScoreDistribution } from "./api";

// Deliberately distinct counts per bucket so each can be asserted with
// getByText without colliding with another bucket's count.
const distribution: ScoreDistribution = {
  ace: 1,
  eagle: 2,
  birdie: 3,
  par: 4,
  bogey: 5,
  doubleBogey: 6,
  worse: 7,
};

describe("ScoreDistributionChart", () => {
  it("labels every outcome bucket", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    expect(screen.getByText("Ace")).toBeInTheDocument();
    expect(screen.getByText("Eagle")).toBeInTheDocument();
    expect(screen.getByText("Birdie")).toBeInTheDocument();
    expect(screen.getByText("Par")).toBeInTheDocument();
    expect(screen.getByText("Bogey")).toBeInTheDocument();
    expect(screen.getByText("Double bogey")).toBeInTheDocument();
    expect(screen.getByText("Triple bogey+")).toBeInTheDocument();
  });

  it("shows the percentage share and count for each bucket", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    // Total is 28 (1+2+3+4+5+6+7), so each bucket's share is count/28 rounded.
    expect(screen.getByText("4% (1)")).toBeInTheDocument();
    expect(screen.getByText("7% (2)")).toBeInTheDocument();
    expect(screen.getByText("11% (3)")).toBeInTheDocument();
    expect(screen.getByText("14% (4)")).toBeInTheDocument();
    expect(screen.getByText("18% (5)")).toBeInTheDocument();
    expect(screen.getByText("21% (6)")).toBeInTheDocument();
    expect(screen.getByText("25% (7)")).toBeInTheDocument();
  });

  it("shows the total counting throws recorded", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    expect(screen.getByText("28 counting throws recorded")).toBeInTheDocument();
  });

  it("uses singular phrasing for a single recorded throw", () => {
    render(
      <ScoreDistributionChart
        distribution={{
          ace: 1,
          eagle: 0,
          birdie: 0,
          par: 0,
          bogey: 0,
          doubleBogey: 0,
          worse: 0,
        }}
      />,
    );

    expect(screen.getByText("1 counting throw recorded")).toBeInTheDocument();
  });
});
