import { deleteRequest, patchJson, postJson, request } from "../api/client";

export interface RoundSummary {
  id: number;
  createdAt: string;
  completedAt: string | null;
  counting: boolean;
  courseName: string;
  layoutName: string;
  playerCount: number;
}

export interface RoundHole {
  id: number;
  number: number;
  par: number;
  distanceMeters: number | null;
}

export interface RoundPlayer {
  id: number;
  name: string;
}

export interface RoundScore {
  id: number;
  holeId: number;
  playerId: number;
  strokes: number;
  penalties: number;
}

export interface RoundDetail {
  id: number;
  createdAt: string;
  completedAt: string | null;
  counting: boolean;
  course: { id: number; name: string };
  layout: { id: number; name: string };
  holes: RoundHole[];
  players: RoundPlayer[];
  scores: RoundScore[];
}

export interface RoundFilters {
  status?: "in_progress" | "completed";
  playerId?: number;
  courseId?: number;
}

export function listRounds(
  filters: RoundFilters = {},
): Promise<{ rounds: RoundSummary[] }> {
  const params = new URLSearchParams();
  if (filters.status) {
    params.set("status", filters.status);
  }
  if (filters.playerId) {
    params.set("playerId", String(filters.playerId));
  }
  if (filters.courseId) {
    params.set("courseId", String(filters.courseId));
  }
  const query = params.toString();
  return request(`/api/rounds${query ? `?${query}` : ""}`);
}

export function createRound(input: {
  courseId: number;
  layoutId: number;
  playerIds: number[];
}): Promise<RoundDetail> {
  return postJson("/api/rounds", input);
}

export function getRound(roundId: number): Promise<RoundDetail> {
  return request(`/api/rounds/${roundId}`);
}

export function updateHoleScore(
  holeScoreId: number,
  input: { strokes?: number; penalties?: number },
): Promise<RoundScore> {
  return patchJson(`/api/hole-scores/${holeScoreId}`, input);
}

export function completeRound(roundId: number): Promise<RoundDetail> {
  return postJson(`/api/rounds/${roundId}/complete`, {});
}

export function reopenRound(roundId: number): Promise<RoundDetail> {
  return postJson(`/api/rounds/${roundId}/reopen`, {});
}

export function updateRound(
  roundId: number,
  input: { playerIds?: number[]; counting?: boolean },
): Promise<RoundDetail> {
  return patchJson(`/api/rounds/${roundId}`, input);
}

export function deleteRound(roundId: number): Promise<void> {
  return deleteRequest(`/api/rounds/${roundId}`);
}
