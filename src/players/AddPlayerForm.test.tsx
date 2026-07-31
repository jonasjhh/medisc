import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddPlayerForm } from "./AddPlayerForm";
import * as playersApi from "./api";

vi.mock("./api");

describe("AddPlayerForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("adds a player and clears the field", async () => {
    vi.mocked(playersApi.createPlayer).mockResolvedValue({
      id: 1,
      name: "Alice",
      createdAt: "",
      roundCount: 0,
      claimedByUserId: null,
    });
    const onAdded = vi.fn();
    const user = userEvent.setup();

    render(<AddPlayerForm onAdded={onAdded} />);

    const input = screen.getByLabelText(/add player/i);
    await user.type(input, "Alice");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(playersApi.createPlayer).toHaveBeenCalledWith("Alice");
    expect(onAdded).toHaveBeenCalledWith({
      id: 1,
      name: "Alice",
      createdAt: "",
      roundCount: 0,
      claimedByUserId: null,
    });
    expect(input).toHaveValue("");
  });

  it("does not submit a blank name", async () => {
    const onAdded = vi.fn();
    const user = userEvent.setup();

    render(<AddPlayerForm onAdded={onAdded} />);

    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(playersApi.createPlayer).not.toHaveBeenCalled();
    expect(onAdded).not.toHaveBeenCalled();
  });

  it("shows an error message if adding fails", async () => {
    vi.mocked(playersApi.createPlayer).mockRejectedValue(
      new Error("Name already taken"),
    );
    const onAdded = vi.fn();
    const user = userEvent.setup();

    render(<AddPlayerForm onAdded={onAdded} />);

    await user.type(screen.getByLabelText(/add player/i), "Alice");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(await screen.findByText("Name already taken")).toBeInTheDocument();
    expect(onAdded).not.toHaveBeenCalled();
  });
});
