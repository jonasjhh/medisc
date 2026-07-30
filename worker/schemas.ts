import { z } from "zod";

export const createCourseSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const createLayoutSchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export const createHoleSchema = z.object({
  number: z.number().int().min(1).max(200),
  par: z.number().int().min(1).max(20),
  distanceMeters: z.number().int().min(1).max(1500).nullable().optional(),
});
