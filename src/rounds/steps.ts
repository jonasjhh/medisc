import type { RoundHole } from "./api";

export type Step =
  | { kind: "hole"; hole: RoundHole }
  | { kind: "checkpoint"; groupIndex: number }
  | { kind: "final" };

// A completed round bookends the hole-by-hole steps with the same summary
// on both ends, so opening a finished round lands straight on the results
// instead of requiring a click-through from hole 1.
export function buildSteps(
  holeGroups: RoundHole[][],
  isCompleted: boolean,
): Step[] {
  const holeSteps = holeGroups.flatMap((holes, groupIndex) => [
    ...holes.map((hole) => ({ kind: "hole" as const, hole })),
    groupIndex === holeGroups.length - 1
      ? { kind: "final" as const }
      : { kind: "checkpoint" as const, groupIndex },
  ]);
  return isCompleted ? [{ kind: "final" as const }, ...holeSteps] : holeSteps;
}
