import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("renders the app name and navigation links", () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <HomePage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: /medisc/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start a round/i }),
    ).toHaveAttribute("href", "/rounds/new");
    expect(screen.getByRole("link", { name: /courses/i })).toHaveAttribute(
      "href",
      "/courses",
    );
  });
});
