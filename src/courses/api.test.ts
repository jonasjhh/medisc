import { describe, expect, it, vi } from "vitest";
import {
  createCourse,
  createHole,
  createLayout,
  getCourse,
  listCourses,
} from "./api";

function mockFetchOnce(body: unknown, init: { ok?: boolean } = {}) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: init.ok ?? true,
    status: init.ok === false ? 400 : 200,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("courses api", () => {
  it("creates a course", async () => {
    const fetchMock = mockFetchOnce({ id: 1, name: "Maple Hill" });
    const course = await createCourse("Maple Hill");
    expect(course).toEqual({ id: 1, name: "Maple Hill" });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Maple Hill" }),
      }),
    );
  });

  it("lists courses", async () => {
    mockFetchOnce({ courses: [{ id: 1, name: "Maple Hill" }] });
    const { courses } = await listCourses();
    expect(courses).toEqual([{ id: 1, name: "Maple Hill" }]);
  });

  it("gets a course's detail", async () => {
    const fetchMock = mockFetchOnce({ id: 1, name: "Maple Hill", layouts: [] });
    await getCourse(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses/1", undefined);
  });

  it("creates a layout under a course", async () => {
    const fetchMock = mockFetchOnce({ id: 5, courseId: 1, name: "Blue" });
    await createLayout(1, "Blue");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/1/layouts",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Blue" }),
      }),
    );
  });

  it("creates a hole under a layout", async () => {
    const fetchMock = mockFetchOnce({
      id: 9,
      layoutId: 5,
      number: 1,
      par: 3,
      distanceFeet: 275,
    });
    await createHole(5, { number: 1, par: 3, distanceFeet: 275 });
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/layouts/5/holes",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ number: 1, par: 3, distanceFeet: 275 }),
      }),
    );
  });

  it("surfaces the server's error message on failure", async () => {
    mockFetchOnce({ error: "Course not found" }, { ok: false });
    await expect(getCourse(999)).rejects.toThrow("Course not found");
  });
});
