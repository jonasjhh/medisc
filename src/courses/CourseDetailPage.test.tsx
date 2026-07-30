import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CourseDetailPage } from "./CourseDetailPage";
import * as api from "./api";

vi.mock("./api");

const baseCourse: api.CourseDetail = {
  id: 1,
  name: "Maple Hill",
  createdAt: "",
  layouts: [
    {
      id: 10,
      name: "Blue",
      createdAt: "",
      holes: [{ id: 100, number: 1, par: 3, distanceMeters: 275 }],
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/courses/1"]}>
      <Routes>
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CourseDetailPage", () => {
  beforeEach(() => {
    vi.mocked(api.getCourse).mockResolvedValue(baseCourse);
  });

  it("shows the course, its layouts, and holes", async () => {
    renderPage();

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("Hole 1 — Par 3")).toBeInTheDocument();
    expect(screen.getByText("275 m")).toBeInTheDocument();
  });

  it("adds a layout and shows it once the course refreshes", async () => {
    vi.mocked(api.createLayout).mockResolvedValue({
      id: 11,
      courseId: 1,
      name: "Red",
      createdAt: "",
    });
    vi.mocked(api.getCourse).mockResolvedValue({
      ...baseCourse,
      layouts: [
        ...baseCourse.layouts,
        { id: 11, name: "Red", createdAt: "", holes: [] },
      ],
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Maple Hill");
    await user.type(screen.getByLabelText(/layout name/i), "Red");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(api.createLayout).toHaveBeenCalledWith(1, "Red");
    expect(await screen.findByText("Red")).toBeInTheDocument();
  });

  it("adds a hole to a layout", async () => {
    vi.mocked(api.createHole).mockResolvedValue({
      id: 101,
      layoutId: 10,
      number: 2,
      par: 4,
      distanceMeters: null,
    });
    const user = userEvent.setup();
    renderPage();

    await screen.findByText("Maple Hill");
    await user.type(screen.getByLabelText(/hole #/i), "2");
    await user.type(screen.getByLabelText(/^par/i), "4");
    await user.click(screen.getByRole("button", { name: /add hole/i }));

    expect(api.createHole).toHaveBeenCalledWith(10, {
      number: 2,
      par: 4,
      distanceMeters: null,
    });
  });

  it("shows an error state when the course fails to load", async () => {
    vi.mocked(api.getCourse).mockRejectedValue(new Error("Course not found"));
    renderPage();

    expect(await screen.findByText("Course not found")).toBeInTheDocument();
  });
});
