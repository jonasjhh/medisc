import { z } from "zod";

export const courseSummarySchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  layoutCount: z.number(),
  roundCount: z.number(),
});
export type CourseSummary = z.infer<typeof courseSummarySchema>;

export const courseListResponseSchema = z.object({
  courses: z.array(courseSummarySchema),
});
export type CourseListResponse = z.infer<typeof courseListResponseSchema>;

export const holeSchema = z.object({
  id: z.number(),
  number: z.number(),
  par: z.number(),
  distanceMeters: z.number().nullable(),
});
export type Hole = z.infer<typeof holeSchema>;

export const layoutSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  holes: z.array(holeSchema),
});
export type Layout = z.infer<typeof layoutSchema>;

export const courseDetailSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  layouts: z.array(layoutSchema),
});
export type CourseDetail = z.infer<typeof courseDetailSchema>;
