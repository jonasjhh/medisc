import { render, screen } from "@testing-library/react";
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
      holes: [
        { id: 100, number: 1, par: 3, distanceMeters: 275 },
        { id: 101, number: 2, par: 4, distanceMeters: null },
      ],
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

  it("shows the course, its layouts, and holes split across two hole tables", async () => {
    renderPage();

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /holes 1–1/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("table", { name: /holes 2–2/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("275 m")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("shows an empty state when a course has no layouts", async () => {
    vi.mocked(api.getCourse).mockResolvedValue({ ...baseCourse, layouts: [] });
    renderPage();

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText(/no layouts yet/i)).toBeInTheDocument();
  });

  it("shows an error state when the course fails to load", async () => {
    vi.mocked(api.getCourse).mockRejectedValue(new Error("Course not found"));
    renderPage();

    expect(await screen.findByText("Course not found")).toBeInTheDocument();
  });
});
