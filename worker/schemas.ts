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

export const createPlayerSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const createRoundSchema = z.object({
  courseId: z.number().int().positive(),
  layoutId: z.number().int().positive(),
  playerIds: z.array(z.number().int().positive()).min(1),
});

export const updateHoleScoreSchema = z
  .object({
    strokes: z.number().int().min(1).max(20).optional(),
    penalties: z.number().int().min(0).max(20).optional(),
  })
  .refine(
    (data) => data.strokes !== undefined || data.penalties !== undefined,
    {
      message: "strokes or penalties must be provided",
    },
  );
