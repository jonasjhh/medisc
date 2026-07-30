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

interface HoleResponse {
  id: number;
  layoutId: number;
  number: number;
  par: number;
  distanceMeters: number | null;
}

interface CourseDetailResponse extends CourseResponse {
  layouts: Array<{
    id: number;
    name: string;
    holes: Array<{
      id: number;
      number: number;
      par: number;
      distanceMeters: number | null;
    }>;
  }>;
}

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function createCourseAndLayout() {
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
  const layout = await json<LayoutResponse>(layoutRes);
  return { course, layout };
}

describe("layouts API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
  });

  it("adds a hole to a layout", async () => {
    const { course, layout } = await createCourseAndLayout();

    const holeRes = await app.request(
      `/api/layouts/${layout.id}/holes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 3, distanceMeters: 275 }),
      },
      env,
    );
    expect(holeRes.status).toBe(201);
    const hole = await json<HoleResponse>(holeRes);
    expect(hole).toMatchObject({
      layoutId: layout.id,
      number: 1,
      par: 3,
      distanceMeters: 275,
    });

    const detailRes = await app.request(`/api/courses/${course.id}`, {}, env);
    const detail = await json<CourseDetailResponse>(detailRes);
    expect(detail.layouts[0].holes).toEqual([
      { id: hole.id, number: 1, par: 3, distanceMeters: 275 },
    ]);
  });

  it("allows a hole with no distance", async () => {
    const { layout } = await createCourseAndLayout();

    const holeRes = await app.request(
      `/api/layouts/${layout.id}/holes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 3 }),
      },
      env,
    );
    expect(holeRes.status).toBe(201);
    const hole = await json<HoleResponse>(holeRes);
    expect(hole.distanceMeters).toBeNull();
  });

  it("rejects a duplicate hole number on the same layout", async () => {
    const { layout } = await createCourseAndLayout();

    await app.request(
      `/api/layouts/${layout.id}/holes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 3 }),
      },
      env,
    );

    const dupeRes = await app.request(
      `/api/layouts/${layout.id}/holes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 4 }),
      },
      env,
    );
    expect(dupeRes.status).toBe(409);
  });

  it("404s when adding a hole to a layout that doesn't exist", async () => {
    const res = await app.request(
      "/api/layouts/999/holes",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 3 }),
      },
      env,
    );
    expect(res.status).toBe(404);
  });

  it("rejects an invalid par", async () => {
    const { layout } = await createCourseAndLayout();

    const res = await app.request(
      `/api/layouts/${layout.id}/holes`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ number: 1, par: 0 }),
      },
      env,
    );
    expect(res.status).toBe(400);
  });
});
