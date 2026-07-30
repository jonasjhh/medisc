import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";
import { localStore } from "../storage/localStore";

describe("HomePage", () => {
  beforeEach(async () => {
    await localStore.clear();
  });

  it("renders the hello world heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /hello, world!/i }),
    ).toBeInTheDocument();
  });

  it("persists and displays a visit count via localforage", async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(screen.getByText(/visit #1/i)).toBeInTheDocument();
    });
    await expect(localStore.getItem("visitCount")).resolves.toBe(1);
  });
});
