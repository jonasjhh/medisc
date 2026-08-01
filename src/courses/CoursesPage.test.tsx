import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoursesPage } from "./CoursesPage";
import * as api from "./api";

vi.mock("./api");

describe("CoursesPage", () => {
  beforeEach(() => {
    vi.mocked(api.listCourses).mockResolvedValue({
      courses: [{ id: 1, name: "Maple Hill", createdAt: "", layoutCount: 2 }],
    });
  });

  it("lists existing courses", async () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("2 layouts")).toBeInTheDocument();
  });

  it("shows an empty state when there are no courses", async () => {
    vi.mocked(api.listCourses).mockResolvedValue({ courses: [] });

    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
  });
});
