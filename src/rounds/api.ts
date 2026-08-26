import { deleteRequest, patchJson, postJson, request } from "../api/client";
import {
  holeScoreResponseSchema,
  roundDetailSchema,
  roundListResponseSchema,
} from "../../shared/contracts/rounds";
import type {
  HoleScoreResponse,
  RoundDetail,
  RoundHole,
  RoundListResponse,
  RoundPlayer,
  RoundScore,
  RoundSummary,
  RoundWeather,
} from "../../shared/contracts/rounds";

export type {
  HoleScoreResponse,
  RoundDetail,
  RoundHole,
  RoundListResponse,
  RoundPlayer,
  RoundScore,
  RoundSummary,
  RoundWeather,
};

export interface RoundFilters {
  status?: "in_progress" | "completed";
  playerId?: number;
  courseId?: number;
}

export async function listRounds(
  filters: RoundFilters = {},
): Promise<RoundListResponse> {
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
  return roundListResponseSchema.parse(
    await request(`/api/rounds${query ? `?${query}` : ""}`),
  );
}

export async function createRound(
  input: { courseId: number; layoutId: number; playerIds: number[] },
  idempotencyKey: string,
): Promise<RoundDetail> {
  return roundDetailSchema.parse(
    await postJson("/api/rounds", input, {
      "Idempotency-Key": idempotencyKey,
    }),
  );
}

export async function getRound(roundId: number): Promise<RoundDetail> {
  return roundDetailSchema.parse(await request(`/api/rounds/${roundId}`));
}

export async function updateHoleScore(
  holeScoreId: number,
  input: { strokes?: number; penalties?: number },
): Promise<HoleScoreResponse> {
  return holeScoreResponseSchema.parse(
    await patchJson(`/api/hole-scores/${holeScoreId}`, input),
  );
}

export async function unsetHoleScore(
  holeScoreId: number,
): Promise<HoleScoreResponse> {
  return holeScoreResponseSchema.parse(
    await postJson(`/api/hole-scores/${holeScoreId}/unset`, {}),
  );
}

export async function completeRound(roundId: number): Promise<RoundDetail> {
  return roundDetailSchema.parse(
    await postJson(`/api/rounds/${roundId}/complete`, {}),
  );
}

export async function reopenRound(roundId: number): Promise<RoundDetail> {
  return roundDetailSchema.parse(
    await postJson(`/api/rounds/${roundId}/reopen`, {}),
  );
}

export async function updateRound(
  roundId: number,
  input: { playerIds?: number[]; counting?: boolean },
): Promise<RoundDetail> {
  return roundDetailSchema.parse(
    await patchJson(`/api/rounds/${roundId}`, input),
  );
}

export function deleteRound(roundId: number): Promise<void> {
  return deleteRequest(`/api/rounds/${roundId}`);
}
