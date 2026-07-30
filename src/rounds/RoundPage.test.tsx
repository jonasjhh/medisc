import { render, screen, waitFor, within } from "@testing-library/react";
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
    { id: 1000, holeId: 100, playerId: 1, strokes: 3, penalties: 0 },
    { id: 1001, holeId: 101, playerId: 1, strokes: 4, penalties: 0 },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/rounds/1"]}>
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
        { id: 1, name: "Alice", createdAt: "", roundCount: 1 },
        { id: 2, name: "Bob", createdAt: "", roundCount: 0 },
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

  it("disables previous on the first hole and next on the last", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    expect(
      screen.getByRole("button", { name: /previous hole/i }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /next hole/i }));
    await screen.findByText("Hole 2");
    expect(screen.getByRole("button", { name: /next hole/i })).toBeDisabled();
  });

  it("increments strokes and saves the change", async () => {
    vi.mocked(roundsApi.updateHoleScore).mockResolvedValue({
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 4,
      penalties: 0,
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

  it("does not let strokes go below 1", async () => {
    const roundAtMin: roundsApi.RoundDetail = {
      ...baseRound,
      scores: [
        { id: 1000, holeId: 100, playerId: 1, strokes: 1, penalties: 0 },
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

  it("swaps which players are in the round", async () => {
    vi.mocked(roundsApi.updateRound).mockResolvedValue({
      ...baseRound,
      players: [{ id: 2, name: "Bob" }],
      scores: [
        { id: 2000, holeId: 100, playerId: 2, strokes: 3, penalties: 0 },
        { id: 2001, holeId: 101, playerId: 2, strokes: 4, penalties: 0 },
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

  it("deletes the round after confirming in the dialog", async () => {
    vi.mocked(roundsApi.deleteRound).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /delete round/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /delete/i }));

    expect(roundsApi.deleteRound).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Rounds list page")).toBeInTheDocument();
  });

  it("cancels round deletion without calling the API", async () => {
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /delete round/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(roundsApi.deleteRound).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("swaps a single player with the per-row swap control", async () => {
    vi.mocked(roundsApi.updateRound).mockResolvedValue({
      ...baseRound,
      players: [{ id: 2, name: "Bob" }],
      scores: [
        { id: 2000, holeId: 100, playerId: 2, strokes: 3, penalties: 0 },
        { id: 2001, holeId: 101, playerId: 2, strokes: 4, penalties: 0 },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Hole 1");
    await user.click(screen.getByRole("button", { name: /manage players/i }));

    await user.click(await screen.findByLabelText("Swap for"));
    await user.click(await screen.findByRole("option", { name: "Bob" }));
    await user.click(screen.getByRole("button", { name: /save players/i }));

    expect(roundsApi.updateRound).toHaveBeenCalledWith(1, {
      playerIds: [2],
    });
  });
});
