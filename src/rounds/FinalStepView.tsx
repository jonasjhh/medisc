import Stack from "@mui/material/Stack";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScorecardGroupTable } from "./ScorecardGroupTable";
import { TotalsList } from "./TotalsList";

export function FinalStepView({
  players,
  scores,
  holeGroups,
  scoreByKey,
}: {
  players: RoundPlayer[];
  scores: RoundScore[];
  holeGroups: RoundHole[][];
  scoreByKey: Map<string, RoundScore>;
}) {
  return (
    <Stack spacing={2}>
      <TotalsList
        players={players}
        scores={scores}
        holesInScope={holeGroups.flat()}
      />
      {holeGroups.map((holes) => (
        <ScorecardGroupTable
          key={holes[0].id}
          holes={holes}
          players={players}
          scoreByKey={scoreByKey}
        />
      ))}
    </Stack>
  );
}
