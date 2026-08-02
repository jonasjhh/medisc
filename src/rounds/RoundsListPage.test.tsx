import { render, screen, waitFor, within } from "@testing-library/react";
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
    vi.clearAllMocks();
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
          players: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
        },
      ],
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maple Hill — Blue")).toBeInTheDocument();
    expect(screen.getByText("Alice, Bob")).toBeInTheDocument();
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
          players: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
        },
      ],
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Completed")).toBeInTheDocument();
  });

  it("shows a fallback when a round has no players", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
          completedAt: null,
          counting: true,
          courseName: "Maple Hill",
          layoutName: "Blue",
          players: [],
        },
      ],
    });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maple Hill — Blue")).toBeInTheDocument();
    expect(screen.getByText("No players")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({ rounds: [] });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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

  it("deletes a round after confirming in the dialog", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
          completedAt: null,
          counting: true,
          courseName: "Maple Hill",
          layoutName: "Blue",
          players: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
        },
      ],
    });
    vi.mocked(roundsApi.deleteRound).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoundsListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Maple Hill — Blue");
    await user.click(
      screen.getByRole("button", { name: /delete round: maple hill/i }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /delete/i }));

    expect(roundsApi.deleteRound).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(screen.queryByText("Maple Hill — Blue")).not.toBeInTheDocument(),
    );
  });

  it("cancels round deletion without calling the API", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
          completedAt: null,
          counting: true,
          courseName: "Maple Hill",
          layoutName: "Blue",
          players: [
            { id: 1, name: "Alice" },
            { id: 2, name: "Bob" },
          ],
        },
      ],
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <RoundsListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Maple Hill — Blue");
    await user.click(
      screen.getByRole("button", { name: /delete round: maple hill/i }),
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(roundsApi.deleteRound).not.toHaveBeenCalled();
    expect(screen.getByText("Maple Hill — Blue")).toBeInTheDocument();
  });
});
