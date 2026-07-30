import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import app from "../index";
import { seedCourse } from "../test/seed";

async function json<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

describe("courses API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM holes");
    await env.DB.exec("DELETE FROM layouts");
    await env.DB.exec("DELETE FROM courses");
  });

  it("lists courses with their layout count", async () => {
    await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [],
    });

    const res = await app.request("/api/courses", {}, env);
    expect(res.status).toBe(200);
    const { courses } = await json<{
      courses: Array<{ name: string; layoutCount: number }>;
    }>(res);
    expect(courses).toEqual([
      expect.objectContaining({ name: "Maple Hill", layoutCount: 1 }),
    ]);
  });

  it("gets a course with its layouts and holes nested", async () => {
    const { courseId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [{ number: 1, par: 3, distanceMeters: 275 }],
    });

    const res = await app.request(`/api/courses/${courseId}`, {}, env);
    expect(res.status).toBe(200);
    const detail = await json<{
      name: string;
      layouts: Array<{
        name: string;
        holes: Array<{
          number: number;
          par: number;
          distanceMeters: number | null;
        }>;
      }>;
    }>(res);
    expect(detail.name).toBe("Maple Hill");
    expect(detail.layouts).toHaveLength(1);
    expect(detail.layouts[0]).toMatchObject({
      name: "Blue",
      holes: [{ number: 1, par: 3, distanceMeters: 275 }],
    });
  });

  it("404s when fetching a course that doesn't exist", async () => {
    const res = await app.request("/api/courses/999", {}, env);
    expect(res.status).toBe(404);
  });
});
