import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoursesPage } from "./CoursesPage";
import * as api from "./api";

vi.mock("./api");

function renderPage() {
  return render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <CoursesPage />
    </MemoryRouter>,
  );
}

const mapleHillDetail: api.CourseDetail = {
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
    {
      id: 11,
      name: "Red",
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

describe("CoursesPage", () => {
  beforeEach(() => {
    vi.mocked(api.listCourses).mockResolvedValue({
      courses: [
        {
          id: 1,
          name: "Maple Hill",
          createdAt: "",
          layoutCount: 2,
          roundCount: 5,
        },
      ],
    });
    vi.mocked(api.getCourse).mockResolvedValue(mapleHillDetail);
  });

  it("lists existing courses as separate boxes", async () => {
    renderPage();

    expect(await screen.findByText("Maple Hill")).toBeInTheDocument();
    expect(screen.getByText("2 layouts · 5 rounds")).toBeInTheDocument();
  });

  it("uses singular phrasing for one layout and one round", async () => {
    vi.mocked(api.listCourses).mockResolvedValue({
      courses: [
        {
          id: 1,
          name: "Pine Valley",
          createdAt: "",
          layoutCount: 1,
          roundCount: 1,
        },
      ],
    });

    renderPage();

    expect(await screen.findByText("Pine Valley")).toBeInTheDocument();
    expect(screen.getByText("1 layout · 1 round")).toBeInTheDocument();
  });

  it("shows an empty state when there are no courses", async () => {
    vi.mocked(api.listCourses).mockResolvedValue({ courses: [] });

    renderPage();

    expect(await screen.findByText(/no courses yet/i)).toBeInTheDocument();
  });

  it("does not fetch layouts until the course is expanded", async () => {
    renderPage();

    await screen.findByText("Maple Hill");
    expect(api.getCourse).not.toHaveBeenCalled();
  });

  it("expands a course to show each layout's hole count, par, and distance", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Maple Hill"));

    expect(api.getCourse).toHaveBeenCalledWith(1);
    expect(await screen.findByText("Blue")).toBeInTheDocument();
    expect(screen.getByText("2 holes · Par 7 · 275m")).toBeInTheDocument();
    expect(screen.getByText("Red")).toBeInTheDocument();
    expect(screen.getByText(/18 holes · Par 54 ·/)).toBeInTheDocument();
  });

  it("does not show the hole-by-hole table until a layout is expanded", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Maple Hill"));
    await screen.findByText("Blue");

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("expands a layout to show the hole-by-hole summary", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Maple Hill"));
    await user.click(await screen.findByText("Blue"));

    const table = screen.getByRole("table", { name: /holes 1–2/i });
    expect(within(table).getByText("275")).toBeInTheDocument();
    expect(within(table).getByText("—")).toBeInTheDocument();
  });

  it("shows an empty state when an expanded course has no layouts", async () => {
    vi.mocked(api.getCourse).mockResolvedValue({
      ...mapleHillDetail,
      layouts: [],
    });
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Maple Hill"));

    expect(await screen.findByText(/no layouts yet/i)).toBeInTheDocument();
  });

  it("shows an error when a course's layouts fail to load", async () => {
    vi.mocked(api.getCourse).mockRejectedValue(new Error("nope"));
    const user = userEvent.setup();
    renderPage();

    await user.click(await screen.findByText("Maple Hill"));

    expect(
      await screen.findByText(/failed to load layouts/i),
    ).toBeInTheDocument();
  });
});
