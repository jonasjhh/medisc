import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewRoundPage } from "./NewRoundPage";
import * as coursesApi from "../courses/api";
import * as playersApi from "../players/api";
import * as roundsApi from "./api";
import { IdentityProvider } from "../identity/IdentityContext";
import * as identityApi from "../identity/api";
import { InstallPromptProvider } from "../app/InstallPromptContext";

vi.mock("../courses/api");
vi.mock("../players/api");
vi.mock("./api");
vi.mock("../identity/api");

describe("NewRoundPage", () => {
  beforeEach(() => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: null,
        },
      ],
    });
    vi.mocked(coursesApi.listCourses).mockResolvedValue({
      courses: [
        {
          id: 1,
          name: "Maple Hill",
          createdAt: "",
          layoutCount: 1,
          roundCount: 0,
        },
      ],
    });
    vi.mocked(coursesApi.getCourse).mockResolvedValue({
      id: 1,
      name: "Maple Hill",
      createdAt: "",
      layouts: [{ id: 10, name: "Blue", createdAt: "", holes: [] }],
    });
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({ user: null });
    vi.mocked(playersApi.getRecentCourses).mockResolvedValue({
      recentCourses: [],
    });
  });

  function renderPage() {
    return render(
      <MemoryRouter
        initialEntries={["/rounds/new"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <InstallPromptProvider>
          <IdentityProvider>
            <Routes>
              <Route path="/rounds/new" element={<NewRoundPage />} />
              <Route path="/rounds/:roundId" element={<div>Round page</div>} />
            </Routes>
          </IdentityProvider>
        </InstallPromptProvider>
      </MemoryRouter>,
    );
  }

  it("lets you add a new player", async () => {
    vi.mocked(playersApi.createPlayer).mockResolvedValue({
      id: 2,
      name: "Bob",
      createdAt: "",
      roundCount: 0,
      claimedByUserId: null,
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
      weather: null,
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
      expect(roundsApi.createRound).toHaveBeenCalledWith(
        {
          courseId: 1,
          layoutId: 10,
          playerIds: [1],
        },
        expect.any(String),
      );
    });
    expect(await screen.findByText("Round page")).toBeInTheDocument();
  });

  it("retries with the same idempotency key when the selections haven't changed", async () => {
    const createRoundMock = vi.mocked(roundsApi.createRound);
    createRoundMock
      .mockRejectedValueOnce(new Error("network error"))
      .mockResolvedValueOnce({
        id: 5,
        createdAt: "",
        completedAt: null,
        counting: true,
        course: { id: 1, name: "Maple Hill" },
        layout: { id: 10, name: "Blue" },
        holes: [],
        players: [],
        scores: [],
        weather: null,
      });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByLabelText("Alice"));
    await user.click(await screen.findByLabelText("Course"));
    await user.click(await screen.findByRole("option", { name: "Maple Hill" }));
    await user.click(await screen.findByLabelText("Layout"));
    await user.click(await screen.findByRole("option", { name: "Blue" }));

    await user.click(screen.getByRole("button", { name: /start round/i }));
    await waitFor(() => {
      expect(createRoundMock).toHaveBeenCalledTimes(1);
    });
    await user.click(screen.getByRole("button", { name: /start round/i }));
    await waitFor(() => {
      expect(createRoundMock).toHaveBeenCalledTimes(2);
    });

    const [, firstKey] = createRoundMock.mock.calls[0];
    const [, secondKey] = createRoundMock.mock.calls[1];
    expect(secondKey).toBe(firstKey);
  });

  it("disables Start round until a player and layout are selected", async () => {
    renderPage();
    await screen.findByText("Alice");
    expect(screen.getByRole("button", { name: /start round/i })).toBeDisabled();
  });

  it("pre-selects the claimed player, leaving other players unchecked", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [
        {
          id: 1,
          name: "Alice",
          createdAt: "",
          roundCount: 0,
          claimedByUserId: 42,
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
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: {
        id: 42,
        createdAt: "",
        claimedPlayer: { id: 1, name: "Alice" },
      },
    });
    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Alice")).toBeChecked();
    });
    expect(screen.getByLabelText("Bob")).not.toBeChecked();
  });

  function mockClaimedPlayer() {
    vi.mocked(identityApi.getCurrentUser).mockResolvedValue({
      user: {
        id: 42,
        createdAt: "",
        claimedPlayer: { id: 1, name: "Alice" },
      },
    });
  }

  it("hides the recent courses section when there are none", async () => {
    mockClaimedPlayer();
    renderPage();

    await screen.findByText("Alice");
    expect(screen.queryByText("Recent courses")).not.toBeInTheDocument();
  });

  it("hides the recent courses section without a claimed player", async () => {
    vi.mocked(playersApi.getRecentCourses).mockResolvedValue({
      recentCourses: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 10,
          layoutName: "Blue",
        },
      ],
    });
    renderPage();

    await screen.findByText("Alice");
    expect(playersApi.getRecentCourses).not.toHaveBeenCalled();
    expect(screen.queryByText("Recent courses")).not.toBeInTheDocument();
  });

  it("shows however many recent courses exist, up to 3", async () => {
    mockClaimedPlayer();
    vi.mocked(playersApi.getRecentCourses).mockResolvedValue({
      recentCourses: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 10,
          layoutName: "Blue",
        },
        {
          courseId: 2,
          courseName: "Pine Ridge",
          layoutId: 20,
          layoutName: "Red",
        },
      ],
    });
    renderPage();

    await screen.findByText("Recent courses");
    expect(
      screen.getByRole("button", { name: "Maple Hill — Blue" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pine Ridge — Red" }),
    ).toBeInTheDocument();
  });

  it("selects a recent course's specific layout in one click", async () => {
    mockClaimedPlayer();
    vi.mocked(coursesApi.listCourses).mockResolvedValue({
      courses: [
        {
          id: 1,
          name: "Maple Hill",
          createdAt: "",
          layoutCount: 2,
          roundCount: 0,
        },
      ],
    });
    vi.mocked(coursesApi.getCourse).mockResolvedValue({
      id: 1,
      name: "Maple Hill",
      createdAt: "",
      layouts: [
        { id: 10, name: "Blue", createdAt: "", holes: [] },
        { id: 11, name: "Gold", createdAt: "", holes: [] },
      ],
    });
    vi.mocked(playersApi.getRecentCourses).mockResolvedValue({
      recentCourses: [
        {
          courseId: 1,
          courseName: "Maple Hill",
          layoutId: 11,
          layoutName: "Gold",
        },
      ],
    });
    vi.mocked(roundsApi.createRound).mockResolvedValue({
      id: 5,
      createdAt: "",
      completedAt: null,
      counting: true,
      course: { id: 1, name: "Maple Hill" },
      layout: { id: 11, name: "Gold" },
      holes: [],
      players: [],
      scores: [],
      weather: null,
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Maple Hill — Gold" }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /start round/i }),
      ).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: /start round/i }));
    await waitFor(() => {
      expect(roundsApi.createRound).toHaveBeenCalledWith(
        { courseId: 1, layoutId: 11, playerIds: [1] },
        expect.any(String),
      );
    });
  });
});
