import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundPage } from "./RoundPage";
import * as roundsApi from "./api";

vi.mock("./api");

const baseRound: roundsApi.RoundDetail = {
  id: 1,
  createdAt: "",
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
        <Route path="/rounds/:roundId" element={<RoundPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("RoundPage", () => {
  beforeEach(() => {
    vi.mocked(roundsApi.getRound).mockResolvedValue(baseRound);
  });

  it("shows the first hole and current player scores", async () => {
    renderPage();

    expect(await screen.findByText("Hole 1")).toBeInTheDocument();
    expect(screen.getByText(/par 3/i)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
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
});
