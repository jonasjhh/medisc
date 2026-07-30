import { describe, expect, it, vi } from "vitest";
import { getCourse, listCourses } from "./api";

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

  it("surfaces the server's error message on failure", async () => {
    mockFetchOnce({ error: "Course not found" }, { ok: false });
    await expect(getCourse(999)).rejects.toThrow("Course not found");
  });
});
