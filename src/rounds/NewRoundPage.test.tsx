import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewRoundPage } from "./NewRoundPage";
import * as coursesApi from "../courses/api";
import * as playersApi from "../players/api";
import * as roundsApi from "./api";

vi.mock("../courses/api");
vi.mock("../players/api");
vi.mock("./api");

describe("NewRoundPage", () => {
  beforeEach(() => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    vi.mocked(coursesApi.listCourses).mockResolvedValue({
      courses: [{ id: 1, name: "Maple Hill", createdAt: "", layoutCount: 1 }],
    });
    vi.mocked(coursesApi.getCourse).mockResolvedValue({
      id: 1,
      name: "Maple Hill",
      createdAt: "",
      layouts: [{ id: 10, name: "Blue", createdAt: "", holes: [] }],
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter initialEntries={["/rounds/new"]}>
        <Routes>
          <Route path="/rounds/new" element={<NewRoundPage />} />
          <Route path="/rounds/:roundId" element={<div>Round page</div>} />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("lets you add a new player", async () => {
    vi.mocked(playersApi.createPlayer).mockResolvedValue({
      id: 2,
      name: "Bob",
      createdAt: "",
      roundCount: 0,
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Alice");
    await user.type(screen.getByLabelText(/add player/i), "Bob");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(playersApi.createPlayer).toHaveBeenCalledWith("Bob");
    expect(await screen.findByText("Bob")).toBeInTheDocument();
  });

  it("starts a round once players and a layout are picked", async () => {
    vi.mocked(roundsApi.createRound).mockResolvedValue({
      id: 5,
      createdAt: "",
      completedAt: null,
      counting: true,
      course: { id: 1, name: "Maple Hill" },
      layout: { id: 10, name: "Blue" },
      holes: [],
      players: [],
      scores: [],
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByLabelText("Alice"));

    const courseSelect = await screen.findByLabelText("Course");
    await user.click(courseSelect);
    await user.click(await screen.findByRole("option", { name: "Maple Hill" }));

    const layoutSelect = await screen.findByLabelText("Layout");
    await user.click(layoutSelect);
    await user.click(await screen.findByRole("option", { name: "Blue" }));

    await user.click(screen.getByRole("button", { name: /start round/i }));

    await waitFor(() => {
      expect(roundsApi.createRound).toHaveBeenCalledWith({
        courseId: 1,
        layoutId: 10,
        playerIds: [1],
      });
    });
    expect(await screen.findByText("Round page")).toBeInTheDocument();
  });

  it("disables Start round until a player and layout are selected", async () => {
    renderPage();
    await screen.findByText("Alice");
    expect(screen.getByRole("button", { name: /start round/i })).toBeDisabled();
  });
});
