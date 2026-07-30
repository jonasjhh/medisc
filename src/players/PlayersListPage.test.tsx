import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { PlayersListPage } from "./PlayersListPage";
import * as playersApi from "./api";

vi.mock("./api");

describe("PlayersListPage", () => {
  it("lists existing players", async () => {
    vi.mocked(playersApi.listPlayers).mockResolvedValue({
      players: [{ id: 1, name: "Alice", createdAt: "" }],
    });

    render(
      <MemoryRouter>
        <PlayersListPage />
      </MemoryRouter>,
    );

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
});
