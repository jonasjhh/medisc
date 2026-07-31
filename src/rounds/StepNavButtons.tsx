import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";

export function StepNavButtons({
  isFirstStep,
  isLastStep,
  onPrevious,
  onNext,
}: {
  isFirstStep: boolean;
  isLastStep: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={onPrevious}
        disabled={isFirstStep}
      >
        Previous
      </Button>
      <Button
        endIcon={<ArrowForwardIcon />}
        onClick={onNext}
        disabled={isLastStep}
      >
        Next
      </Button>
    </Stack>
  );
}
