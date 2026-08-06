import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import type { ScoreDistribution } from "./api";

// Deliberately distinct counts per bucket so each can be asserted with
// getByText without colliding with another bucket's count.
const distribution: ScoreDistribution = {
  ace: 1,
  albatross: 2,
  eagle: 3,
  birdie: 4,
  par: 5,
  bogey: 6,
  doubleBogey: 7,
  worse: 8,
};

describe("ScoreDistributionChart", () => {
  it("labels every outcome bucket", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    expect(screen.getByText("Ace")).toBeInTheDocument();
    expect(screen.getByText("Albatross")).toBeInTheDocument();
    expect(screen.getByText("Eagle")).toBeInTheDocument();
    expect(screen.getByText("Birdie")).toBeInTheDocument();
    expect(screen.getByText("Par")).toBeInTheDocument();
    expect(screen.getByText("Bogey")).toBeInTheDocument();
    expect(screen.getByText("Double bogey")).toBeInTheDocument();
    expect(screen.getByText("Triple bogey+")).toBeInTheDocument();
  });

  it("shows the percentage share and count for each bucket", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    // Total is 36 (1+2+3+4+5+6+7+8), so each bucket's share is count/36 rounded.
    expect(screen.getByText("3% (1)")).toBeInTheDocument();
    expect(screen.getByText("6% (2)")).toBeInTheDocument();
    expect(screen.getByText("8% (3)")).toBeInTheDocument();
    expect(screen.getByText("11% (4)")).toBeInTheDocument();
    expect(screen.getByText("14% (5)")).toBeInTheDocument();
    expect(screen.getByText("17% (6)")).toBeInTheDocument();
    expect(screen.getByText("19% (7)")).toBeInTheDocument();
    expect(screen.getByText("22% (8)")).toBeInTheDocument();
  });

  it("shows the total counting throws recorded", () => {
    render(<ScoreDistributionChart distribution={distribution} />);

    expect(screen.getByText("36 counting throws recorded")).toBeInTheDocument();
  });

  it("uses singular phrasing for a single recorded throw", () => {
    render(
      <ScoreDistributionChart
        distribution={{
          ace: 1,
          albatross: 0,
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
