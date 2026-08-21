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

describe("HoleBreakdownPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 2,
          claimedByUserId: null,
        },
      ],
    });
    vi.mocked(playersApi.getPlayerStats).mockResolvedValue({ holes });
  });

  it("shows the hole, the comparison to the field, the distribution, and the throws", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: { id: 100, number: 1, par: 3, distanceMeters: 90, layoutId: 10 },
        distribution: { ...emptyDistribution, birdie: 1, par: 1 },
        throws: [
          { roundId: 1, date: "2026-08-01 10:00:00", strokes: 2, penalties: 0 },
          { roundId: 2, date: "2026-08-05 10:00:00", strokes: 3, penalties: 1 },
        ],
        playerAvgStrokes: 2.5,
        allPlayersAvgStrokes: 3,
      },
    });

    renderPage();

    expect(await screen.findByText("Hole 1")).toBeInTheDocument();
    expect(screen.getByText("Par 3 · 90 m")).toBeInTheDocument();
    expect(screen.getByText("2.5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("-0.5")).toBeInTheDocument();
    expect(screen.getByText("Throw distribution")).toBeInTheDocument();
    expect(screen.getByText("+1 pen.")).toBeInTheDocument();
  });

  it("shows an empty state when the player hasn't played this hole", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockResolvedValue({
      breakdown: {
        hole: {
          id: 100,
          number: 1,
          par: 3,
          distanceMeters: null,
          layoutId: 10,
        },
        distribution: emptyDistribution,
        throws: [],
        playerAvgStrokes: null,
        allPlayersAvgStrokes: 3,
      },
    });

    renderPage();

    expect(
      await screen.findByText("No counting throws recorded on this hole yet."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Throw distribution")).not.toBeInTheDocument();
  });

  it("navigates to the next hole and disables Next on the last hole", async () => {
    vi.mocked(playersApi.getHoleBreakdown).mockImplementation(
      async (_playerId, holeId) => ({
        breakdown: {
          hole: {
            id: holeId,
            number: holes.find((h) => h.holeId === holeId)!.number,
            par: 3,
            distanceMeters: null,
            layoutId: 10,
          },
          distribution: emptyDistribution,
          throws: [],
          playerAvgStrokes: null,
          allPlayersAvgStrokes: null,
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
        hole: {
          id: 100,
          number: 1,
          par: 3,
          distanceMeters: null,
          layoutId: 10,
        },
        distribution: emptyDistribution,
        throws: [],
        playerAvgStrokes: null,
        allPlayersAvgStrokes: null,
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
