import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlayersListPage } from "./PlayersListPage";
import * as playersApi from "./api";

vi.mock("./api");

describe("PlayersListPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists existing players", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("adds a new player", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    vi.mocked(playersApi.createPlayer).mockResolvedValue({
      id: 2,
      name: "Bob",
      createdAt: "",
      roundCount: 0,
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    await user.type(screen.getByLabelText(/add player/i), "Bob");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(playersApi.createPlayer).toHaveBeenCalledWith("Bob");
    expect(await screen.findByText("Bob")).toBeInTheDocument();
  });

  it("renames a player", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    vi.mocked(playersApi.updatePlayer).mockResolvedValue({
      id: 1,
      name: "Ally",
      createdAt: "",
      roundCount: 0,
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /edit alice/i }));

    const input = screen.getByLabelText("Name");
    await user.clear(input);
    await user.type(input, "Ally");
    await user.click(screen.getByRole("button", { name: /save name/i }));

    expect(playersApi.updatePlayer).toHaveBeenCalledWith(1, "Ally");
    expect(await screen.findByText("Ally")).toBeInTheDocument();
  });

  it("cancels an edit without saving", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /edit alice/i }));
    await user.click(screen.getByRole("button", { name: /cancel edit/i }));

    expect(playersApi.updatePlayer).not.toHaveBeenCalled();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({ players: [] });

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no players yet/i)).toBeInTheDocument();
  });

  it("deletes a player with no recorded rounds after confirming", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    vi.mocked(playersApi.deletePlayer).mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /delete alice/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /delete/i }));

    expect(playersApi.deletePlayer).toHaveBeenCalledWith(1);
    await waitFor(() =>
      expect(screen.queryByText("Alice")).not.toBeInTheDocument(),
    );
  });

  it("cancels player deletion without calling the API", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 0 }],
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    await user.click(screen.getByRole("button", { name: /delete alice/i }));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));

    expect(playersApi.deletePlayer).not.toHaveBeenCalled();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("disables deleting a player who has recorded rounds", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "", roundCount: 2 }],
    });

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

    await screen.findByText("Alice");
    expect(
      screen.getByRole("button", { name: /delete alice/i }),
    ).toBeDisabled();
  });
});
