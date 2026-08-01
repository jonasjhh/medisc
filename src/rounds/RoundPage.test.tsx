import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundPage } from "./RoundPage";
import * as playersApi from "../players/api";
import * as roundsApi from "./api";

vi.mock("../players/api");
vi.mock("./api");

const baseRound: roundsApi.RoundDetail = {
  id: 1,
  createdAt: "",
  completedAt: null,
  counting: true,
  course: { id: 1, name: "Maple Hill" },
  layout: { id: 10, name: "Blue" },
  holes: [
    { id: 100, number: 1, par: 3, distanceMeters: 90 },
    { id: 101, number: 2, par: 4, distanceMeters: 120 },
  ],
  players: [{ id: 1, name: "Alice" }],
  scores: [
    {
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 3,
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
  ],
};

const twelveHoleRound: roundsApi.RoundDetail = {
  id: 2,
  createdAt: "",
  completedAt: null,
  counting: true,
  course: { id: 2, name: "Stjørdal" },
  layout: { id: 20, name: "12 Hull" },
  holes: Array.from({ length: 12 }, (_, i) => ({
    id: 300 + i,
    number: i + 1,
    par: 3,
    distanceMeters: 80 + i,
  })),
  players: [{ id: 1, name: "Alice" }],
  scores: Array.from({ length: 12 }, (_, i) => ({
    id: 3000 + i,
    holeId: 300 + i,
    playerId: 1,
    strokes: 3,
    penalties: 0,
    recorded: false,
  })),
};

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={["/rounds/1"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/rounds" element={<div>Rounds list page</div>} />
        <Route path="/rounds/:roundId" element={<RoundPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoundPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roundsApi.getRound).mockResolvedValue(baseRound);
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 1,
          claimedByUserId: null,
        },
        {
          id: 2,
          name: "Bob",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
  });

  it("shows the first hole and current player scores", async () => {
    renderPage();

    expect(await screen.findByText("Hole 1")).toBeInTheDocument();
    expect(screen.getByText(/par 3/i)).toBeInTheDocument();
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("navigates to the next hole", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /next hole/i }));

    expect(await screen.findByText("Hole 2")).toBeInTheDocument();
    expect(screen.getByText(/par 4/i)).toBeInTheDocument();
  });

  it("disables previous on the first hole and next on the final summary step", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.getByRole("button", { name: /previous hole/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Hole 2");
    expect(screen.getByRole("button", { name: /next hole/i })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Summary");
    expect(screen.getByRole("button", { name: /next hole/i })).toBeDisabled();
  });

  it("increments strokes and saves the change", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockResolvedValue({
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 4,
      penalties: 0,
      recorded: true,
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /increase strokes/i }));

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(roundsApi.updateHoleScore).toHaveBeenCalledWith(1000, {
      strokes: 4,
    });
  });

  it("shows an error instead of the round when it fails to load", async () => {
    vi.mocked(roundsApi.getRound).mockRejectedValue(
      new Error("round not found"),
    );
    renderPage();

    expect(await screen.findByText("round not found")).toBeInTheDocument();
    expect(screen.queryByText("Hole 1")).not.toBeInTheDocument();
  });

  it("shows an inline error banner when saving a score fails", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockRejectedValue(
      new Error("save failed"),
    );
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /increase strokes/i }));

    expect(await screen.findByText("save failed")).toBeInTheDocument();
    // The failed save triggers a refresh, restoring the server's score.
    expect(roundsApi.getRound).toHaveBeenCalledTimes(2);
  });

  it("does not let strokes go below 1", async () => {
    const roundAtMin: roundsApi.RoundDetail = {
      ...baseRound,
      scores: [
        {
          id: 1000,
          holeId: 100,
          playerId: 1,
          strokes: 1,
          penalties: 0,
          recorded: true,
        },
        baseRound.scores[1],
      ],
    };
    vi.mocked(roundsApi.getRound).mockResolvedValue(roundAtMin);
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.getByRole("button", { name: /decrease strokes/i }),
    ).toBeDisabled();
  });

  it("finishes the round and shows a Completed badge instead of adjusters", async () => {
    vi.mocked(roundsApi.completeRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /finish round/i }));

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /increase strokes/i }),
    ).not.toBeInTheDocument();
  });

  it("shows a completed round as read-only from the start", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    renderPage();

    expect(await screen.findByText("Completed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /finish round/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /increase strokes/i }),
    ).not.toBeInTheDocument();
  });

  it("toggles the counting flag", async () => {
    vi.mocked(roundsApi.updateRound).mockResolvedValue({
      ...baseRound,
      counting: false,
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    const toggle = screen.getByRole("checkbox", { name: /counting round/i });
    expect(toggle).toBeChecked();

    await user.click(toggle);

    expect(roundsApi.updateRound).toHaveBeenCalledWith(1, {
      counting: false,
    });
    expect(
      await screen.findByRole("checkbox", { name: /counting round/i }),
    ).not.toBeChecked();
  });

  it("disables the counting toggle on a completed round", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.getByRole("checkbox", { name: /counting round/i }),
    ).toBeDisabled();
  });

  it("swaps which players are in the round", async () => {
    vi.mocked(roundsApi.updateRound).mockResolvedValue({
      ...baseRound,
      players: [{ id: 2, name: "Bob" }],
      scores: [
        {
          id: 2000,
          holeId: 100,
          playerId: 2,
          strokes: 3,
          penalties: 0,
          recorded: true,
        },
        {
          id: 2001,
          holeId: 101,
          playerId: 2,
          strokes: 4,
          penalties: 0,
          recorded: true,
        },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /manage players/i }));

    await user.click(await screen.findByLabelText("Bob"));
    await user.click(screen.getByLabelText("Alice"));
    await user.click(screen.getByRole("button", { name: /save players/i }));

    expect(roundsApi.updateRound).toHaveBeenCalledWith(1, {
      playerIds: [2],
    });
    await screen.findByRole("button", { name: /manage players/i });
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("does not offer to manage players on a completed round", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.queryByRole("button", { name: /manage players/i }),
    ).not.toBeInTheDocument();
  });

  it("reopens a completed round, restoring the score adjusters", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    vi.mocked(roundsApi.reopenRound).mockResolvedValue(baseRound);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Completed");
    await user.click(screen.getByRole("button", { name: /reopen round/i }));

    expect(roundsApi.reopenRound).toHaveBeenCalledWith(1);
    expect(await screen.findByText(/finish round/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /increase strokes/i }),
    ).toBeInTheDocument();
  });

  it("sets strokes to par with the quick-score buttons", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockResolvedValue({
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 3,
      penalties: 0,
      recorded: true,
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: "Bogey" }));

    expect(roundsApi.updateHoleScore).toHaveBeenCalledWith(1000, {
      strokes: 4,
    });
    expect(await screen.findByText("4")).toBeInTheDocument();
  });

  it("does not show quick-score buttons on a completed round", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.queryByRole("button", { name: "Birdie" }),
    ).not.toBeInTheDocument();
  });

  it("swaps a single player with the standalone swap button", async () => {
    vi.mocked(roundsApi.updateRound).mockResolvedValue({
      ...baseRound,
      players: [{ id: 2, name: "Bob" }],
      scores: [
        {
          id: 2000,
          holeId: 100,
          playerId: 2,
          strokes: 3,
          penalties: 0,
          recorded: true,
        },
        {
          id: 2001,
          holeId: 101,
          playerId: 2,
          strokes: 4,
          penalties: 0,
          recorded: true,
        },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /swap alice/i }));
    await user.click(await screen.findByRole("menuitem", { name: "Bob" }));

    expect(roundsApi.updateRound).toHaveBeenCalledWith(1, {
      playerIds: [2],
    });
    await waitFor(() =>
      expect(screen.getAllByText("Bob").length).toBeGreaterThan(0),
    );
  });

  it("disables the swap button when there is nobody else to swap in", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 1,
          claimedByUserId: null,
        },
      ],
    });
    renderPage();

    await screen.findByText("Hole 1");
    expect(screen.getByRole("button", { name: /swap alice/i })).toBeDisabled();
  });

  it("does not offer to swap players on a completed round", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue({
      ...baseRound,
      completedAt: "2026-01-01 12:00:00",
    });
    renderPage();

    await screen.findByText("Completed");
    expect(
      screen.queryByRole("button", { name: /swap alice/i }),
    ).not.toBeInTheDocument();
  });

  it("reaches the scorecard summary after the last hole and shows totals", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Hole 2");
    expect(screen.getByRole("button", { name: /next hole/i })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: /next hole/i }));

    expect(await screen.findByText("Summary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /next hole/i })).toBeDisabled();
    // Alice: 3 + 4 = 7 strokes against a course par of 7 (3 + 4) → even.
    expect(screen.getByText("Alice: 7 (E)")).toBeInTheDocument();
    expect(screen.getAllByTestId("score-badge")).toHaveLength(2);
  });

  it("navigates back from the summary to the last hole", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Summary");

    await user.click(screen.getByRole("button", { name: /previous hole/i }));

    expect(await screen.findByText("Hole 2")).toBeInTheDocument();
  });

  it("shows an F9 checkpoint after the front 9 with cumulative totals", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(twelveHoleRound);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    for (let i = 0; i < 9; i++) {
      await user.click(screen.getByRole("button", { name: /next hole/i }));
    }

    expect(await screen.findByText("F9")).toBeInTheDocument();
    expect(screen.getByText("Par 27 through hole 9")).toBeInTheDocument();
    expect(screen.getByText("Alice: 27 (E)")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /holes 1–9/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", { name: /holes 10–12/i }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next hole/i }));
    expect(await screen.findByText("Hole 10")).toBeInTheDocument();
  });

  it("shows bottom Previous/Next buttons on hole and checkpoint steps, but not on the final summary", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Hole 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Summary");
    expect(
      screen.queryByRole("button", { name: "Previous" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Next" }),
    ).not.toBeInTheDocument();
  });

  it("shows bottom Previous/Next buttons on a checkpoint step", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(twelveHoleRound);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    for (let i = 0; i < 9; i++) {
      await user.click(screen.getByRole("button", { name: /next hole/i }));
    }
    await screen.findByText("F9");

    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(await screen.findByText("Hole 10")).toBeInTheDocument();
  });

  it("shows an unrecorded score as a dash and reveals it after an adjustment", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(twelveHoleRound);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    expect(screen.getByText("-")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /increase strokes/i }));

    expect(await screen.findByText("4")).toBeInTheDocument();
    expect(screen.queryByText("-")).not.toBeInTheDocument();
  });

  it("shows no quick-score button pressed for an unrecorded hole, and registers a par in one click", async () => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(twelveHoleRound);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    const parButton = screen.getByRole("button", { name: "Par" });
    expect(parButton).toHaveAttribute("aria-pressed", "false");

    await user.click(parButton);

    expect(parButton).toHaveAttribute("aria-pressed", "true");
    expect(roundsApi.updateHoleScore).toHaveBeenCalledWith(3000, {
      strokes: 3,
    });
  });
});
