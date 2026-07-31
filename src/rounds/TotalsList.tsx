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
  const holeIds = new Set(holesInScope.map((hole) => hole.id));
  const par = holesInScope.reduce((sum, hole) => sum + hole.par, 0);
  return (
    <Stack spacing={0.5}>
      {players.map((player) => {
        const total = scores
          .filter(
            (score) =>
              score.playerId === player.id && holeIds.has(score.holeId),
          )
          .reduce((sum, score) => sum + score.strokes, 0);
        return (
          <Typography key={player.id} fontWeight={600}>
            {player.name}: {total} ({relativeToPar(total, par)})
          </Typography>
        );
      })}
    </Stack>
  );
}
