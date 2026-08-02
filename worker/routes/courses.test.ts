import { env } from "cloudflare:test";
import { beforeEach, describe, expect, it } from "vitest";
import type { ZodTypeAny, z } from "zod";
import app from "../index";
import { seedCourse } from "../test/seed";
import {
  courseDetailSchema,
  courseListResponseSchema,
} from "../../shared/contracts/courses";

async function json<S extends ZodTypeAny>(
  response: Response,
  schema: S,
): Promise<z.infer<S>> {
  return schema.parse(await response.json());
}

describe("courses API", () => {
  beforeEach(async () => {
    await env.DB.exec("DELETE FROM hole_scores");
    await env.DB.exec("DELETE FROM round_players");
    await env.DB.exec("DELETE FROM rounds");
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
    const { courses } = await json(res, courseListResponseSchema);
    expect(courses).toEqual([
      expect.objectContaining({
        name: "Maple Hill",
        layoutCount: 1,
        roundCount: 0,
      }),
    ]);
  });

  it("lists courses with the number of rounds played there", async () => {
    const { courseId, layoutId } = await seedCourse(env, {
      courseName: "Maple Hill",
      layoutName: "Blue",
      holes: [],
    });
    await env.DB.prepare(
      "INSERT INTO rounds (course_id, layout_id) VALUES (?, ?)",
    )
      .bind(courseId, layoutId)
      .run();
    await env.DB.prepare(
      "INSERT INTO rounds (course_id, layout_id) VALUES (?, ?)",
    )
      .bind(courseId, layoutId)
      .run();

    const res = await app.request("/api/courses", {}, env);
    const { courses } = await json(res, courseListResponseSchema);
    expect(courses).toEqual([
      expect.objectContaining({ name: "Maple Hill", roundCount: 2 }),
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
    const detail = await json(res, courseDetailSchema);
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
