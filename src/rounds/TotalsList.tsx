import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";

function relativeToPar(total: number, par: number): string {
  const diff = total - par;
  if (diff === 0) {
    return "E";
  }
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export function TotalsList({
  players,
  scores,
  holesInScope,
}: {
  players: RoundPlayer[];
  scores: RoundScore[];
  holesInScope: RoundHole[];
}) {
  const parByHoleId = new Map(holesInScope.map((hole) => [hole.id, hole.par]));
  return (
    <Stack spacing={0.5}>
      {players.map((player) => {
        // Par is summed over the same holes as the strokes total, not
        // every hole in scope — otherwise a partly-played round would
        // compare a few holes' worth of strokes against a much larger par.
        const recordedScores = scores.filter(
          (score) =>
            score.playerId === player.id &&
            score.recorded &&
            parByHoleId.has(score.holeId),
        );
        const total = recordedScores.reduce(
          (sum, score) => sum + score.strokes,
          0,
        );
        const par = recordedScores.reduce(
          (sum, score) => sum + (parByHoleId.get(score.holeId) ?? 0),
          0,
        );
        return (
          <Typography key={player.id} fontWeight={600}>
            {player.name}: {total} ({relativeToPar(total, par)})
          </Typography>
        );
      })}
    </Stack>
  );
}
