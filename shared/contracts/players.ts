import { z } from "zod";

export const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string(),
  roundCount: z.number(),
  claimedByUserId: z.number().nullable(),
});
export type Player = z.infer<typeof playerSchema>;

export const playerListResponseSchema = z.object({
  players: z.array(playerSchema),
});
export type PlayerListResponse = z.infer<typeof playerListResponseSchema>;

export const playedLayoutSchema = z.object({
  courseId: z.number(),
  courseName: z.string(),
  layoutId: z.number(),
  layoutName: z.string(),
});
export type PlayedLayout = z.infer<typeof playedLayoutSchema>;

export const playedLayoutsResponseSchema = z.object({
  layouts: z.array(playedLayoutSchema),
});
export type PlayedLayoutsResponse = z.infer<typeof playedLayoutsResponseSchema>;

export const recentCoursesResponseSchema = z.object({
  recentCourses: z.array(playedLayoutSchema),
});
export type RecentCoursesResponse = z.infer<typeof recentCoursesResponseSchema>;

export const holeStatSchema = z.object({
  holeId: z.number(),
  number: z.number(),
  par: z.number(),
  timesPlayed: z.number(),
  avgStrokes: z.number(),
  bestStrokes: z.number(),
  worstStrokes: z.number(),
  avgPenalties: z.number(),
});
export type HoleStat = z.infer<typeof holeStatSchema>;

export const holeStatsResponseSchema = z.object({
  holes: z.array(holeStatSchema),
});
export type HoleStatsResponse = z.infer<typeof holeStatsResponseSchema>;

// Bucket names match src/rounds/scoreColor.ts's ScoreOutcome so the two stay
// interchangeable in the UI without a translation layer.
export const scoreDistributionSchema = z.object({
  ace: z.number(),
  albatross: z.number(),
  eagle: z.number(),
  birdie: z.number(),
  par: z.number(),
  bogey: z.number(),
  doubleBogey: z.number(),
  worse: z.number(),
});
export type ScoreDistribution = z.infer<typeof scoreDistributionSchema>;

export const scoreDistributionResponseSchema = z.object({
  distribution: scoreDistributionSchema,
});
export type ScoreDistributionResponse = z.infer<
  typeof scoreDistributionResponseSchema
>;

export const holeThrowSchema = z.object({
  roundId: z.number(),
  date: z.string(),
  strokes: z.number(),
  penalties: z.number(),
});
export type HoleThrow = z.infer<typeof holeThrowSchema>;

export const holeBreakdownSchema = z.object({
  hole: z.object({
    id: z.number(),
    number: z.number(),
    par: z.number(),
    distanceMeters: z.number().nullable(),
    layoutId: z.number(),
  }),
  distribution: scoreDistributionSchema,
  throws: z.array(holeThrowSchema),
  playerAvgStrokes: z.number().nullable(),
  allPlayersAvgStrokes: z.number().nullable(),
});
export type HoleBreakdown = z.infer<typeof holeBreakdownSchema>;

export const holeBreakdownResponseSchema = z.object({
  breakdown: holeBreakdownSchema,
});
export type HoleBreakdownResponse = z.infer<typeof holeBreakdownResponseSchema>;
