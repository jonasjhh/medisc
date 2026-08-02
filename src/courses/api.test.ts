import { describe, expect, it, vi } from "vitest";
import { getCourse, listCourses } from "./api";
import {
  courseDetailSchema,
  courseSummarySchema,
} from "../../shared/contracts/courses";
import type {
  CourseDetail,
  CourseSummary,
} from "../../shared/contracts/courses";

function aCourseSummary(overrides: Partial<CourseSummary> = {}): CourseSummary {
  return courseSummarySchema.parse({
    id: 1,
    name: "Maple Hill",
    createdAt: "",
    layoutCount: 1,
    roundCount: 0,
    ...overrides,
  });
}

function aCourseDetail(overrides: Partial<CourseDetail> = {}): CourseDetail {
  return courseDetailSchema.parse({
    id: 1,
    name: "Maple Hill",
    createdAt: "",
    layouts: [],
    ...overrides,
  });
}

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
    mockFetchOnce({ courses: [aCourseSummary({ id: 1, name: "Maple Hill" })] });
    const { courses } = await listCourses();
    expect(courses).toEqual([aCourseSummary({ id: 1, name: "Maple Hill" })]);
  });

  it("gets a course's detail", async () => {
    const fetchMock = mockFetchOnce(
      aCourseDetail({ id: 1, name: "Maple Hill" }),
    );
    await getCourse(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/courses/1",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );
  });

  it("surfaces the server's error message on failure", async () => {
    mockFetchOnce({ error: "Course not found" }, { ok: false });
    await expect(getCourse(999)).rejects.toThrow("Course not found");
  });
});
