import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TotalsList } from "./TotalsList";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";

const players: RoundPlayer[] = [{ id: 1, name: "Alice" }];
const holes: RoundHole[] = [
  { id: 100, number: 1, par: 3, distanceMeters: 90 },
  { id: 101, number: 2, par: 4, distanceMeters: 120 },
];

function scoreFor(strokes: number): RoundScore[] {
  return [
    {
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes,
      penalties: 0,
      recorded: true,
    },
    {
      id: 1001,
      holeId: 101,
      playerId: 1,
      strokes: 4,
      penalties: 0,
      recorded: true,
    },
  ];
}

describe("TotalsList", () => {
  it("shows E when the total matches par exactly", () => {
    render(
      <TotalsList
        players={players}
        scores={scoreFor(3)}
        holesInScope={holes}
      />,
    );
    expect(screen.getByText("Alice: 7 (E)")).toBeInTheDocument();
  });

  it("shows a + prefix when over par", () => {
    render(
      <TotalsList
        players={players}
        scores={scoreFor(5)}
        holesInScope={holes}
      />,
    );
    expect(screen.getByText("Alice: 9 (+2)")).toBeInTheDocument();
  });

  it("shows a - prefix when under par", () => {
    render(
      <TotalsList
        players={players}
        scores={scoreFor(2)}
        holesInScope={holes}
      />,
    );
    expect(screen.getByText("Alice: 6 (-1)")).toBeInTheDocument();
  });
});
