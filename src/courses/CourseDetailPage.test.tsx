import { render, screen, within } from "@testing-library/react";
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

const eighteenHoleCourse: api.CourseDetail = {
  id: 2,
  name: "Dragvoll",
  createdAt: "",
  layouts: [
    {
      id: 20,
      name: "Standard",
      createdAt: "",
      holes: Array.from({ length: 18 }, (_, i) => ({
        id: 200 + i,
        number: i + 1,
        par: 3,
        distanceMeters: 80 + i,
      })),
    },
  ],
};

function renderPage() {
  return render(
    <MemoryRouter
      initialEntries={["/courses/1"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
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

  it("shows the course, its layouts, and holes in a single group when 9 or fewer", async () => {
    renderPage();

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("Blue")).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /holes 1–2/i });
    expect(within(table).getByText("275")).toBeInTheDocument();
    expect(within(table).getByText("—")).toBeInTheDocument();
    expect(within(table).getByText("Hole")).toBeInTheDocument();
    expect(within(table).getByText("Dist.")).toBeInTheDocument();
    expect(within(table).getByText("Par")).toBeInTheDocument();
  });

  it("splits holes into groups of 9 for longer layouts", async () => {
    vi.mocked(api.getCourse).mockResolvedValue(eighteenHoleCourse);
    renderPage();

    expect(await screen.findByText("Dragvoll")).toBeInTheDocument();
    const front = screen.getByRole("table", { name: /holes 1–9/i });
    const back = screen.getByRole("table", { name: /holes 10–18/i });
    expect(within(front).getByText("9")).toBeInTheDocument();
    expect(within(front).queryByText("10")).not.toBeInTheDocument();
    expect(within(back).getByText("10")).toBeInTheDocument();
    expect(within(back).getByText("18")).toBeInTheDocument();
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
