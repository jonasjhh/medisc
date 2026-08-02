import { z } from "zod";

export const roundHoleSchema = z.object({
  id: z.number(),
  number: z.number(),
  par: z.number(),
  distanceMeters: z.number().nullable(),
});
export type RoundHole = z.infer<typeof roundHoleSchema>;

export const roundPlayerSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type RoundPlayer = z.infer<typeof roundPlayerSchema>;

// The shape of a score nested inside a RoundDetail — roundId is implied by
// context there. The standalone hole-score endpoint below returns roundId
// explicitly, since its caller has no other way to know it.
export const roundScoreSchema = z.object({
  id: z.number(),
  holeId: z.number(),
  playerId: z.number(),
  strokes: z.number(),
  penalties: z.number(),
  recorded: z.boolean(),
});
export type RoundScore = z.infer<typeof roundScoreSchema>;

export const holeScoreResponseSchema = roundScoreSchema.extend({
  roundId: z.number(),
});
export type HoleScoreResponse = z.infer<typeof holeScoreResponseSchema>;

// Fetched from yr.no when the round is created; null when the course has no
// stored coordinates or the weather API call failed.
export const roundWeatherSchema = z.object({
  temperatureCelsius: z.number(),
  windSpeedMs: z.number(),
  windDirectionDegrees: z.number(),
  // yr.no's symbol code, e.g. "partlycloudy_day" — null when their
  // short-term summary wasn't present in the response.
  symbolCode: z.string().nullable(),
});
export type RoundWeather = z.infer<typeof roundWeatherSchema>;

export const roundDetailSchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  counting: z.boolean(),
  course: z.object({ id: z.number(), name: z.string() }),
  layout: z.object({ id: z.number(), name: z.string() }),
  holes: z.array(roundHoleSchema),
  players: z.array(roundPlayerSchema),
  scores: z.array(roundScoreSchema),
  weather: roundWeatherSchema.nullable(),
});
export type RoundDetail = z.infer<typeof roundDetailSchema>;

export const roundSummarySchema = z.object({
  id: z.number(),
  createdAt: z.string(),
  completedAt: z.string().nullable(),
  counting: z.boolean(),
  courseName: z.string(),
  layoutName: z.string(),
  players: z.array(roundPlayerSchema),
  weather: roundWeatherSchema.nullable(),
});
export type RoundSummary = z.infer<typeof roundSummarySchema>;

export const roundListResponseSchema = z.object({
  rounds: z.array(roundSummarySchema),
});
export type RoundListResponse = z.infer<typeof roundListResponseSchema>;
