import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
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
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("2 layouts")).toBeInTheDocument();
  });

  it("shows an empty state when there are no courses", async () => {
    vi.mocked(api.listCourses).mockResolvedValue({ courses: [] });

    render(
      <MemoryRouter>
        <CoursesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
  });

  it("adds a course and navigates to its detail page", async () => {
    vi.mocked(api.createCourse).mockResolvedValue({
      id: 2,
      name: "Winthrop",
      createdAt: "",
    });
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/courses"]}>
        <Routes>
          <Route path="/courses" element={<CoursesPage />} />
          <Route
            path="/courses/:courseId"
            element={<div>Course detail page</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByText("Maple Hill");
    await user.type(screen.getByLabelText(/course name/i), "Winthrop");
    await user.click(screen.getByRole("button", { name: /add course/i }));

    expect(await screen.findByText("Course detail page")).toBeInTheDocument();
    expect(api.createCourse).toHaveBeenCalledWith("Winthrop");
  });
});
