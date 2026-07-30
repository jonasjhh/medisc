import { patchJson, postJson, request } from "../api/client";

export interface Player {
  id: number;
  name: string;
  createdAt: string;
}

export interface RoundSummary {
  id: number;
  createdAt: string;
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
  course: { id: number; name: string };
  layout: { id: number; name: string };
  holes: RoundHole[];
  players: RoundPlayer[];
  scores: RoundScore[];
}

export function listPlayers(): Promise<{ players: Player[] }> {
  return request("/api/players");
}

export function createPlayer(name: string): Promise<Player> {
  return postJson("/api/players", { name });
}

export function listRounds(): Promise<{ rounds: RoundSummary[] }> {
  return request("/api/rounds");
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
