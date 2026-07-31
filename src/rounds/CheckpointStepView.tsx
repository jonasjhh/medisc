import Stack from "@mui/material/Stack";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScorecardGroupTable } from "./ScorecardGroupTable";
import { StepNavButtons } from "./StepNavButtons";
import { TotalsList } from "./TotalsList";

export function CheckpointStepView({
  players,
  scores,
  holeGroups,
  groupIndex,
  scoreByKey,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
}: {
  players: RoundPlayer[];
  scores: RoundScore[];
  holeGroups: RoundHole[][];
  groupIndex: number;
  scoreByKey: Map<string, RoundScore>;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const groupsSoFar = holeGroups.slice(0, groupIndex + 1);
  return (
    <Stack spacing={2}>
      <TotalsList
        players={players}
        scores={scores}
        holesInScope={groupsSoFar.flat()}
      />
      {groupsSoFar.map((holes) => (
        <ScorecardGroupTable
          key={holes[0].id}
          holes={holes}
          players={players}
          scoreByKey={scoreByKey}
        />
      ))}
      <StepNavButtons
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Stack>
  );
}
