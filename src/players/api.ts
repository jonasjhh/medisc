import { deleteRequest, patchJson, postJson, request } from "../api/client";
import {
  holeStatsResponseSchema,
  playedLayoutsResponseSchema,
  playerListResponseSchema,
  playerSchema,
  recentCoursesResponseSchema,
  scoreDistributionResponseSchema,
} from "../../shared/contracts/players";
import type {
  HoleStat,
  HoleStatsResponse,
  PlayedLayout,
  PlayedLayoutsResponse,
  Player,
  PlayerListResponse,
  RecentCoursesResponse,
  ScoreDistribution,
  ScoreDistributionResponse,
} from "../../shared/contracts/players";

export type {
  HoleStat,
  HoleStatsResponse,
  PlayedLayout,
  PlayedLayoutsResponse,
  Player,
  PlayerListResponse,
  RecentCoursesResponse,
  ScoreDistribution,
  ScoreDistributionResponse,
};

export async function listPlayers(options?: {
  unclaimed?: boolean;
}): Promise<PlayerListResponse> {
  return playerListResponseSchema.parse(
    await request(
      options?.unclaimed ? "/api/players?unclaimed=true" : "/api/players",
    ),
  );
}

export async function createPlayer(name: string): Promise<Player> {
  return playerSchema.parse(await postJson("/api/players", { name }));
}

export async function claimPlayer(playerId: number): Promise<Player> {
  return playerSchema.parse(
    await postJson(`/api/players/${playerId}/claim`, {}),
  );
}

export async function updatePlayer(
  playerId: number,
  name: string,
): Promise<Player> {
  return playerSchema.parse(
    await patchJson(`/api/players/${playerId}`, { name }),
  );
}

export function deletePlayer(playerId: number): Promise<void> {
  return deleteRequest(`/api/players/${playerId}`);
}

export async function getPlayerLayouts(
  playerId: number,
): Promise<PlayedLayoutsResponse> {
  return playedLayoutsResponseSchema.parse(
    await request(`/api/players/${playerId}/layouts`),
  );
}

export async function getRecentCourses(
  playerId: number,
): Promise<RecentCoursesResponse> {
  return recentCoursesResponseSchema.parse(
    await request(`/api/players/${playerId}/recent-courses`),
  );
}

export async function getPlayerStats(
  playerId: number,
  layoutId: number,
): Promise<HoleStatsResponse> {
  return holeStatsResponseSchema.parse(
    await request(`/api/players/${playerId}/stats?layoutId=${layoutId}`),
  );
}

export async function getScoreDistribution(
  playerId: number,
): Promise<ScoreDistributionResponse> {
  return scoreDistributionResponseSchema.parse(
    await request(`/api/players/${playerId}/score-distribution`),
  );
}
