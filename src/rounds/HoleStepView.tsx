import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScoreAdjuster } from "./ScoreAdjuster";
import { scoreOutcome } from "./scoreColor";
import { StepNavButtons } from "./StepNavButtons";
import { TotalsList } from "./TotalsList";
import type { Field } from "./useRoundData";

const outcomeButtonColor = {
  birdie: "success",
  par: "standard",
  bogey: "warning",
} as const;

export function HoleStepView({
  hole,
  holeGroups,
  players,
  scores,
  isCompleted,
  setScore,
  adjust,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
}: {
  hole: RoundHole;
  holeGroups: RoundHole[][];
  players: RoundPlayer[];
  scores: RoundScore[];
  isCompleted: boolean;
  setScore: (scoreId: number, field: Field, nextValue: number) => Promise<void>;
  adjust: (scoreId: number, field: Field, delta: number) => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const birdieValue = Math.max(1, hole.par - 1);
  const bogeyValue = hole.par + 1;

  return (
    <Stack spacing={1.5}>
      <TotalsList
        players={players}
        scores={scores}
        holesInScope={holeGroups.flat()}
      />
      {players.map((player) => {
        const score = scores.find(
          (candidate) =>
            candidate.holeId === hole.id && candidate.playerId === player.id,
        );
        if (!score) {
          return null;
        }
        const outcome = scoreOutcome(score.strokes, hole.par);
        return (
          <Paper key={player.id} variant="outlined" sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {player.name}
            </Typography>

            {!isCompleted && (
              <ToggleButtonGroup
                exclusive
                size="small"
                fullWidth
                value={score.recorded ? score.strokes : null}
                onChange={(_event, value: number | null) => {
                  if (value !== null) {
                    void setScore(score.id, "strokes", value);
                  }
                }}
                aria-label={`${player.name} quick score`}
                sx={{ mb: 1 }}
              >
                <ToggleButton
                  value={birdieValue}
                  color={outcomeButtonColor.birdie}
                >
                  Birdie
                </ToggleButton>
                <ToggleButton value={hole.par} color={outcomeButtonColor.par}>
                  Par
                </ToggleButton>
                <ToggleButton
                  value={bogeyValue}
                  color={outcomeButtonColor.bogey}
                >
                  Bogey
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="flex-start"
            >
              <ScoreAdjuster
                label="Strokes"
                value={score.strokes}
                min={1}
                readOnly={isCompleted}
                outcome={outcome}
                recorded={score.recorded}
                onDecrement={() => void adjust(score.id, "strokes", -1)}
                onIncrement={() => void adjust(score.id, "strokes", 1)}
              />
              <ScoreAdjuster
                label="Penalties"
                value={score.penalties}
                min={0}
                readOnly={isCompleted}
                size="compact"
                onDecrement={() => void adjust(score.id, "penalties", -1)}
                onIncrement={() => void adjust(score.id, "penalties", 1)}
              />
            </Stack>
          </Paper>
        );
      })}

      <StepNavButtons
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        onPrevious={onPrevious}
        onNext={onNext}
      />
    </Stack>
  );
}
