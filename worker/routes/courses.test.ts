import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";

interface CourseResponse {
  id: number;
  name: string;
  createdAt: string;
}

interface LayoutResponse {
  id: number;
  courseId: number;
  name: string;
  createdAt: string;
}

interface CourseDetailResponse extends CourseResponse {
  layouts: Array<{ id: number; name: string; holes: unknown[] }>;
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("courses API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
  });

  it("creates and lists courses", async () => {
    const createRes = await app.request(
      "/api/courses",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Maple Hill" }),
      },
      env,
    );
    expect(createRes.status).toBe(201);
    const created = await json<CourseResponse>(createRes);
    expect(created).toMatchObject({ name: "Maple Hill" });
    expect(created.id).toBeTypeOf("number");

    const listRes = await app.request("/api/courses", {}, env);
    expect(listRes.status).toBe(200);
    const { courses } = await json<{ courses: unknown[] }>(listRes);
    expect(courses).toHaveLength(1);
    expect(courses[0]).toMatchObject({ name: "Maple Hill", layoutCount: 0 });
  });

  it("rejects a course with an empty name", async () => {
    const res = await app.request(
      "/api/courses",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "" }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });

  it("adds a layout to a course and returns it nested in the course detail", async () => {
    const courseRes = await app.request(
      "/api/courses",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Maple Hill" }),
      },
      env,
    );
    const course = await json<CourseResponse>(courseRes);

    const layoutRes = await app.request(
      `/api/courses/${course.id}/layouts`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Blue" }),
      },
      env,
    );
    expect(layoutRes.status).toBe(201);
    const layout = await json<LayoutResponse>(layoutRes);
    expect(layout).toMatchObject({ courseId: course.id, name: "Blue" });

    const detailRes = await app.request(`/api/courses/${course.id}`, {}, env);
    expect(detailRes.status).toBe(200);
    const detail = await json<CourseDetailResponse>(detailRes);
    expect(detail.layouts).toHaveLength(1);
    expect(detail.layouts[0]).toMatchObject({ name: "Blue", holes: [] });
  });

  it("404s when adding a layout to a course that doesn't exist", async () => {
    const res = await app.request(
      "/api/courses/999/layouts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: "Blue" }),
      },
      env,
    );
    expect(res.status).toBe(404);
  });

  it("404s when fetching a course that doesn't exist", async () => {
    const res = await app.request("/api/courses/999", {}, env);
    expect(res.status).toBe(404);
  });
});
