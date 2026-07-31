import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayerStatsPage } from "./PlayerStatsPage";
import * as playersApi from "./api";
import { IdentityProvider } from "../identity/IdentityContext";
import * as identityApi from "../identity/api";
import { InstallPromptProvider } from "../app/InstallPromptContext";

vi.mock("./api");
vi.mock("../identity/api");

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/players/1"]}>
      <InstallPromptProvider>
        <IdentityProvider>
          <Routes>
            <Route path="/players/:playerId" element={<PlayerStatsPage />} />
          </Routes>
        </IdentityProvider>
      </InstallPromptProvider>
    </MemoryRouter>,
  );
}

describe("PlayerStatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
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
  });

  it("shows an empty state when the player has no completed rounds", async () => {
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({ layouts: [] });

    renderPage();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(
      await screen.findByText(/no completed rounds yet/i),
    ).toBeInTheDocument();
  });

  it("shows a Guest pill for an unclaimed player", async () => {
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({ layouts: [] });

    renderPage();

    await screen.findByText("Alice");
    expect(await screen.findByText("Guest")).toBeInTheDocument();
  });

  it("shows a Claimed pill for a player claimed by someone else", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: { id: 1, createdAt: "", claimedPlayer: null },
    });
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 1,
          claimedByUserId: 5,
        },
      ],
    });
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({ layouts: [] });

    renderPage();

    await screen.findByText("Alice");
    expect(await screen.findByText("Claimed")).toBeInTheDocument();
  });

  it("shows a You pill for the current user's claimed player", async () => {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: { id: 5, createdAt: "", claimedPlayer: { id: 1, name: "Alice" } },
    });
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 1,
          claimedByUserId: 5,
        },
      ],
    });
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({ layouts: [] });

    renderPage();

    await screen.findByText("Alice");
    expect(await screen.findByText("You")).toBeInTheDocument();
  });

  it("shows hole stats for the selected layout", async () => {
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({
      layouts: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 10,
          layoutName: "Blue",
        },
      ],
    });
    vi.mocked(playersApi.getPlayerStats).mockResolvedValue({
      holes: [
        {
          holeId: 100,
          number: 1,
          par: 3,
          timesPlayed: 2,
          avgStrokes: 3.5,
          bestStrokes: 3,
          worstStrokes: 4,
          avgPenalties: 0,
        },
      ],
    });

    renderPage();

    expect(await screen.findByText("Maple Hill — Blue")).toBeInTheDocument();
    expect(playersApi.getPlayerStats).toHaveBeenCalledWith(1, 10);
    expect(await screen.findByText("3.5")).toBeInTheDocument();
  });

  it("switches layouts and refetches stats", async () => {
    vi.mocked(playersApi.getPlayerLayouts).mockResolvedValue({
      layouts: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 10,
          layoutName: "Blue",
        },
        {
          courseId: 2,
          courseName: "Pine Valley",
          layoutId: 20,
          layoutName: "Red",
        },
      ],
    });
    vi.mocked(playersApi.getPlayerStats).mockResolvedValue({ holes: [] });
    const user = userEvent.setup();

    renderPage();

    await screen.findByText("Alice");
    await user.click(screen.getByLabelText("Course & layout"));
    await user.click(
      await screen.findByRole("option", { name: "Pine Valley — Red" }),
    );

    expect(playersApi.getPlayerStats).toHaveBeenLastCalledWith(1, 20);
  });
});
