import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type {
  RoundHole,
  RoundPersonalBest,
  RoundPlayer,
  RoundScore,
} from "./api";
import { relativeToPar } from "./scoreColor";

export function TotalsList({
  players,
  scores,
  holesInScope,
  personalBests,
}: {
  players: RoundPlayer[];
  scores: RoundScore[];
  holesInScope: RoundHole[];
  personalBests?: RoundPersonalBest[] | null;
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
        const isBest = personalBests?.some(
          (pb) => pb.playerId === player.id && pb.isBest,
        );
        return (
          <Stack
            key={player.id}
            direction="row"
            spacing={1}
            alignItems="center"
          >
            <Typography fontWeight={600}>
              {player.name}: {total} ({relativeToPar(total, par)})
            </Typography>
            {isBest && (
              <Chip label="Personal best" color="success" size="small" />
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
