import { Hono } from "hono";
import type { Env } from "../types";

interface CourseRow {
  id: number;
  name: string;
  created_at: string;
}

interface CourseListRow extends CourseRow {
  layout_count: number;
}

interface LayoutRow {
  id: number;
  course_id: number;
  name: string;
  created_at: string;
}

interface HoleRow {
  id: number;
  layout_id: number;
  number: number;
  par: number;
  distance_meters: number | null;
}

export const coursesRoute = new Hono<{ Bindings: Env }>();

coursesRoute.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT courses.id, courses.name, courses.created_at,
            COUNT(layouts.id) AS layout_count
     FROM courses
     LEFT JOIN layouts ON layouts.course_id = courses.id
     GROUP BY courses.id
     ORDER BY courses.created_at DESC`,
  ).all<CourseListRow>();

  return c.json({
    courses: results.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      layoutCount: row.layout_count,
    })),
  });
});

coursesRoute.get("/:courseId", async (c) => {
  const courseId = Number(c.req.param("courseId"));
  if (!Number.isInteger(courseId)) {
    return c.json({ error: "Invalid course id" }, 400);
  }

  const course = await c.env.DB.prepare(
    "SELECT id, name, created_at FROM courses WHERE id = ?",
  )
    .bind(courseId)
    .first<CourseRow>();

  if (!course) {
    return c.json({ error: "Course not found" }, 404);
  }

  const { results: layoutRows } = await c.env.DB.prepare(
    "SELECT id, course_id, name, created_at FROM layouts WHERE course_id = ? ORDER BY id",
  )
    .bind(courseId)
    .all<LayoutRow>();

  const layoutIds = layoutRows.map((layout) => layout.id);
  const holesByLayout = new Map<number, HoleRow[]>();

  if (layoutIds.length > 0) {
    const placeholders = layoutIds.map(() => "?").join(",");
    const { results: holeRows } = await c.env.DB.prepare(
      `SELECT id, layout_id, number, par, distance_meters
       FROM holes
       WHERE layout_id IN (${placeholders})
       ORDER BY number`,
    )
      .bind(...layoutIds)
      .all<HoleRow>();

    for (const hole of holeRows) {
      const holes = holesByLayout.get(hole.layout_id) ?? [];
      holes.push(hole);
      holesByLayout.set(hole.layout_id, holes);
    }
  }

  return c.json({
    id: course.id,
    name: course.name,
    createdAt: course.created_at,
    layouts: layoutRows.map((layout) => ({
      id: layout.id,
      name: layout.name,
      createdAt: layout.created_at,
      holes: (holesByLayout.get(layout.id) ?? []).map((hole) => ({
        id: hole.id,
        number: hole.number,
        par: hole.par,
        distanceMeters: hole.distance_meters,
      })),
    })),
  });
});
