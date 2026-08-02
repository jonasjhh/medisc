import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfflineBanner } from "./OfflineBanner";

function setNavigatorOnLine(value: boolean) {
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(value);
}

describe("OfflineBanner", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing while online", () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows a warning while offline", () => {
    setNavigatorOnLine(false);
    render(<OfflineBanner />);
    expect(screen.getByRole("status")).toHaveTextContent(/you're offline/i);
  });

  it("appears when connectivity drops and clears when it returns", () => {
    setNavigatorOnLine(true);
    render(<OfflineBanner />);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toHaveTextContent(/you're offline/i);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
