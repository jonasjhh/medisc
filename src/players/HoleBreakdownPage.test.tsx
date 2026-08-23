import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HoleBreakdownPage } from "./HoleBreakdownPage";
import * as playersApi from "./api";

vi.mock("./api");

function renderPage(initialHoleId = 100) {
  return render(
    <MemoryRouter
      initialEntries={[`/players/1/holes/${initialHoleId}`]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/players/:playerId/holes/:holeId"
          element={<HoleBreakdownPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

const emptyDistribution = {
  ace: 0,
  albatross: 0,
  eagle: 0,
  birdie: 0,
  par: 0,
  bogey: 0,
  doubleBogey: 0,
  worse: 0,
};

interface HoleFixture {
  id: number;
  number: number;
  par: number;
  distanceMeters: number | null;
  layoutId: number;
  layoutName: string;
  courseName: string;
}

function aHole(overrides: Partial<HoleFixture> = {}): HoleFixture {
  return {
    id: 100,
    number: 1,
    par: 3,
    distanceMeters: null,
    layoutId: 10,
    layoutName: "Blue",
    courseName: "Maple Hill",
    ...overrides,
  };
}

const holes = [
  {
    holeId: 100,
    number: 1,
    par: 3,
    timesPlayed: 2,
    avgStrokes: 3,
    bestStrokes: 2,
    worstStrokes: 4,
    avgPenalties: 0,
  },
  {
    holeId: 101,
    number: 2,
    par: 4,
    timesPlayed: 1,
    avgStrokes: 4,
    bestStrokes: 4,
    worstStrokes: 4,
    avgPenalties: 0,
  },
  {
    holeId: 102,
    number: 3,
    par: 3,
    timesPlayed: 1,
    avgStrokes: 3,
    bestStrokes: 3,
    worstStrokes: 3,
    avgPenalties: 0,
  },
];

const players = [
  { id: 1, name: "Alice", createdAt: "", roundCount: 2, claimedByUserId: null },
  { id: 2, name: "Bob", createdAt: "", roundCount: 2, claimedByUserId: null },
];

describe("HoleBreakdownPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(playersApi.listPlayers).mockResolvedValue({ players });
    vi.mocked(playersApi.getPlayerStats).mockResolvedValue({ holes });
  });

  it("shows the course, layout, hole, field distribution, player distribution, and throws", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: aHole({ distanceMeters: 90 }),
        playerDistribution: { ...emptyDistribution, birdie: 1, par: 1 },
        fieldDistribution: {
          ...emptyDistribution,
          birdie: 1,
          par: 1,
          bogey: 1,
        },
        throws: [
          { roundId: 1, date: "2026-08-01 10:00:00", strokes: 2, penalties: 0 },
          { roundId: 2, date: "2026-08-05 10:00:00", strokes: 3, penalties: 1 },
        ],
        playerAvgStrokes: 2.5,
        fieldAvgStrokes: 3,
      },
    });

    renderPage();

    expect(await screen.findByText("Maple Hill — Blue")).toBeInTheDocument();
    expect(await screen.findByText("Hole 1")).toBeInTheDocument();
    expect(screen.getByText("Par 3 · 90 m")).toBeInTheDocument();
    expect(screen.getByText("The field")).toBeInTheDocument();
    expect(screen.getByText("Alice throws")).toBeInTheDocument();
    expect(screen.getByText("3.0")).toBeInTheDocument(); // field average
    expect(screen.getByText("2.5")).toBeInTheDocument(); // player average
    expect(screen.getByText("+1 pen.")).toBeInTheDocument();
  });

  it("shows an empty state for the player and the field independently", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: aHole(),
        playerDistribution: emptyDistribution,
        fieldDistribution: { ...emptyDistribution, par: 1 },
        throws: [],
        playerAvgStrokes: null,
        fieldAvgStrokes: 3,
      },
    });

    renderPage();

    expect(
      await screen.findByText("No counting throws recorded on this hole yet."),
    ).toBeInTheDocument();
    expect(screen.getByText(/Field average:/)).toBeInTheDocument();
    expect(screen.getByText("3.0")).toBeInTheDocument();
  });

  it("lets you configure the field and refetches with the selected players", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: aHole(),
        playerDistribution: emptyDistribution,
        fieldDistribution: emptyDistribution,
        throws: [],
        playerAvgStrokes: null,
        fieldAvgStrokes: null,
      },
    });
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Hole 1");
    await user.click(
      screen.getByRole("button", { name: "configure the field" }),
    );
    expect(await screen.findByText("Configure the field")).toBeInTheDocument();

    await user.click(screen.getByRole("checkbox", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(playersApi.getHoleBreakdown).toHaveBeenLastCalledWith(1, 100, [1]);
    expect(
      await screen.findByText("The field (1 selected)"),
    ).toBeInTheDocument();
  });

  it("navigates to the next hole and disables Next on the last hole", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockImplementation(
      async (_playerId, holeId) => ({
        breakdown: {
          hole: aHole({
            id: holeId,
            number: holes.find((h) => h.holeId === holeId)!.number,
          }),
          playerDistribution: emptyDistribution,
          fieldDistribution: emptyDistribution,
          throws: [],
          playerAvgStrokes: null,
          fieldAvgStrokes: null,
        },
      }),
    );
    const user = userEvent.setup();

    renderPage(102);

    expect(await screen.findByText("Hole 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "next hole" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "previous hole" }));
    expect(await screen.findByText("Hole 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "previous hole" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "next hole" })).toBeEnabled();
  });

  it("disables Previous on the first hole", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: aHole(),
        playerDistribution: emptyDistribution,
        fieldDistribution: emptyDistribution,
        throws: [],
        playerAvgStrokes: null,
        fieldAvgStrokes: null,
      },
    });

    renderPage(100);

    expect(await screen.findByText("Hole 1")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "previous hole" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "next hole" })).toBeEnabled();
  });
});
