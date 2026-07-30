import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoundsListPage } from "./RoundsListPage";
import * as coursesApi from "../courses/api";
import * as playersApi from "../players/api";
import * as roundsApi from "./api";

vi.mock("../courses/api");
vi.mock("../players/api");
vi.mock("./api");

describe("RoundsListPage", () => {
  beforeEach(() => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "" }],
    });
    vi.mocked(coursesApi.listCourses).mockResolvedValue({
      courses: [{ id: 1, name: "Maple Hill", createdAt: "", layoutCount: 1 }],
    });
  });

  it("lists existing rounds", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
          completedAt: null,
          counting: true,
          courseName: "Maple Hill",
          layoutName: "Blue",
          playerCount: 2,
        },
      ],
    });

    render(
      <MemoryRouter>
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maple Hill — Blue")).toBeInTheDocument();
    expect(screen.getByText("2 players")).toBeInTheDocument();
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("shows a Completed chip for finished rounds", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
          completedAt: "2026-01-01 12:00:00",
          counting: true,
          courseName: "Maple Hill",
          layoutName: "Blue",
          playerCount: 2,
        },
      ],
    });

    render(
      <MemoryRouter>
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({ rounds: [] });

    render(
      <MemoryRouter>
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/no rounds match these filters/i),
    ).toBeInTheDocument();
  });

  it("refetches with a status filter when changed", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({ rounds: [] });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RoundsListPage />
      </MemoryRouter>,
    );

    await screen.findByLabelText("Status");
    await user.click(screen.getByLabelText("Status"));
    await user.click(await screen.findByRole("option", { name: "Completed" }));

    expect(roundsApi.listRounds).toHaveBeenLastCalledWith({
      status: "completed",
      playerId: undefined,
      courseId: undefined,
    });
  });
});
