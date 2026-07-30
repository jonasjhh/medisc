import type { Env } from "../types";

export interface SeedHole {
  number: number;
  par: number;
  distanceMeters?: number | null;
}

export async function seedCourse(
  env: Env,
  options: { courseName?: string; layoutName?: string; holes: SeedHole[] },
) {
  const courseName = options.courseName ?? "Maple Hill";
  const layoutName = options.layoutName ?? "Blue";

  const course = await env.DB.prepare(
    "INSERT INTO courses (name) VALUES (?) RETURNING id",
  )
    .bind(courseName)
    .first<{ id: number }>();

  const layout = await env.DB.prepare(
    "INSERT INTO layouts (course_id, name) VALUES (?, ?) RETURNING id",
  )
    .bind(course!.id, layoutName)
    .first<{ id: number }>();

  for (const hole of options.holes) {
    await env.DB.prepare(
      "INSERT INTO holes (layout_id, number, par, distance_meters) VALUES (?, ?, ?, ?)",
    )
      .bind(layout!.id, hole.number, hole.par, hole.distanceMeters ?? null)
      .run();
  }

  return { courseId: course!.id, layoutId: layout!.id };
}
