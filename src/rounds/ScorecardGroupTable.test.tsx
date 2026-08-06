import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScorecardGroupTable } from "./ScorecardGroupTable";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";

const players: RoundPlayer[] = [{ id: 1, name: "Alice" }];

describe("ScorecardGroupTable", () => {
  it("pads a short trailing group out to a full 9 columns so real holes stay left-aligned", () => {
    const holes: RoundHole[] = [
      { id: 19, number: 19, par: 3, distanceMeters: null },
      { id: 20, number: 20, par: 3, distanceMeters: null },
      { id: 21, number: 21, par: 3, distanceMeters: null },
    ];
    const scoreByKey = new Map<string, RoundScore>();

    render(
      <ScorecardGroupTable
        holes={holes}
        players={players}
        scoreByKey={scoreByKey}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Scorecard summary, holes 19–21",
    });
    const headerRow = table.querySelectorAll("thead tr")[0];
    // 1 label column ("Hole") + 9 padded hole columns, even though only
    // 3 holes were passed in.
    expect(headerRow.children).toHaveLength(1 + 9);
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("21")).toBeInTheDocument();
  });

  it("renders exactly 9 columns for a full group, with no padding", () => {
    const holes: RoundHole[] = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
      number: i + 1,
      par: 3,
      distanceMeters: null,
    }));
    const scoreByKey = new Map<string, RoundScore>();

    render(
      <ScorecardGroupTable
        holes={holes}
        players={players}
        scoreByKey={scoreByKey}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Scorecard summary, holes 1–9",
    });
    const headerRow = table.querySelectorAll("thead tr")[0];
    expect(headerRow.children).toHaveLength(1 + 9);
  });
});
