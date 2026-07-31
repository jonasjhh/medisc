import type { RoundHole } from "./api";

export type Step =
  | { kind: "hole"; hole: RoundHole }
  | { kind: "checkpoint"; groupIndex: number }
  | { kind: "final" };

export function buildSteps(holeGroups: RoundHole[][]): Step[] {
  return holeGroups.flatMap((holes, groupIndex) => [
    ...holes.map((hole) => ({ kind: "hole" as const, hole })),
    groupIndex === holeGroups.length - 1
      ? { kind: "final" as const }
      : { kind: "checkpoint" as const, groupIndex },
  ]);
}
