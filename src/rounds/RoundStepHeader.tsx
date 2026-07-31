import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { RoundHole } from "./api";
import type { Step } from "./steps";

export function RoundStepHeader({
  step,
  holeGroups,
  coursePar,
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
}: {
  step: Step;
  holeGroups: RoundHole[][];
  coursePar: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={{ my: 2 }}
    >
      <IconButton
        aria-label="previous hole"
        onClick={onPrevious}
        disabled={isFirstStep}
      >
        <ArrowBackIcon />
      </IconButton>
      {step.kind === "final" ? (
        <Box textAlign="center">
          <Typography variant="h4">Summary</Typography>
          <Typography color="text.secondary">Course par {coursePar}</Typography>
        </Box>
      ) : step.kind === "checkpoint" ? (
        (() => {
          const holesSoFar = holeGroups.slice(0, step.groupIndex + 1).flat();
          const parSoFar = holesSoFar.reduce((sum, h) => sum + h.par, 0);
          const lastHole = holesSoFar[holesSoFar.length - 1];
          return (
            <Box textAlign="center">
              <Typography variant="h4">F{holesSoFar.length}</Typography>
              <Typography color="text.secondary">
                Par {parSoFar} through hole {lastHole.number}
              </Typography>
            </Box>
          );
        })()
      ) : (
        <Box textAlign="center">
          <Typography variant="h4">Hole {step.hole.number}</Typography>
          <Typography color="text.secondary">
            Par {step.hole.par}
            {step.hole.distanceMeters ? ` · ${step.hole.distanceMeters} m` : ""}
          </Typography>
        </Box>
      )}
      <IconButton aria-label="next hole" onClick={onNext} disabled={isLastStep}>
        <ArrowForwardIcon />
      </IconButton>
    </Stack>
  );
}
