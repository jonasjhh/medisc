import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RoundsListPage } from "./RoundsListPage";
import * as roundsApi from "./api";

vi.mock("./api");

describe("RoundsListPage", () => {
  it("lists existing rounds", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({
      rounds: [
        {
          id: 1,
          createdAt: "",
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
  });

  it("shows an empty state", async () => {
    vi.mocked(roundsApi.listRounds).mockResolvedValue({ rounds: [] });

    render(
      <MemoryRouter>
        <RoundsListPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no rounds yet/i)).toBeInTheDocument();
  });
});
