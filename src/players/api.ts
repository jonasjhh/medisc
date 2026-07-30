import { patchJson, postJson, request } from "../api/client";

export interface Player {
  id: number;
  name: string;
  createdAt: string;
}

export interface PlayedLayout {
  courseId: number;
  courseName: string;
  layoutId: number;
  layoutName: string;
}

export interface HoleStat {
  holeId: number;
  number: number;
  par: number;
  timesPlayed: number;
  avgStrokes: number;
  bestStrokes: number;
  worstStrokes: number;
  avgPenalties: number;
}

export function listPlayers(): Promise<{ players: Player[] }> {
  return request("/api/players");
}

export function createPlayer(name: string): Promise<Player> {
  return postJson("/api/players", { name });
}

export function updatePlayer(playerId: number, name: string): Promise<Player> {
  return patchJson(`/api/players/${playerId}`, { name });
}

export function getPlayerLayouts(
  playerId: number,
): Promise<{ layouts: PlayedLayout[] }> {
  return request(`/api/players/${playerId}/layouts`);
}

export function getPlayerStats(
  playerId: number,
  layoutId: number,
): Promise<{ holes: HoleStat[] }> {
  return request(`/api/players/${playerId}/stats?layoutId=${layoutId}`);
}
