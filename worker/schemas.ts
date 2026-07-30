import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const updatePlayerSchema = z.object({
  name: z.string().trim().min(1).max(60),
});

export const createRoundSchema = z.object({
  courseId: z.number().int().positive(),
  layoutId: z.number().int().positive(),
  playerIds: z.array(z.number().int().positive()).min(1),
});

export const updateRoundSchema = z
  .object({
    playerIds: z.array(z.number().int().positive()).min(1).optional(),
    counting: z.boolean().optional(),
  })
  .refine(
    (data) => data.playerIds !== undefined || data.counting !== undefined,
    {
      message: "playerIds or counting must be provided",
    },
  );

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
