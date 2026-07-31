import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import type { ScoreOutcome } from "./scoreColor";

const outcomeColor: Record<ScoreOutcome, string | undefined> = {
  birdie: "success.main",
  par: undefined,
  bogey: "warning.main",
};

export function ScoreAdjuster({
  label,
  value,
  min,
  onDecrement,
  onIncrement,
  readOnly = false,
  outcome,
  recorded = true,
}: {
  label: string;
  value: number;
  min: number;
  onDecrement: () => void;
  onIncrement: () => void;
  readOnly?: boolean;
  outcome?: ScoreOutcome;
  recorded?: boolean;
}) {
  return (
    <Box textAlign="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box display="flex" alignItems="center" gap={1}>
        {!readOnly && (
          <IconButton
            size="small"
            aria-label={`decrease ${label.toLowerCase()}`}
            onClick={onDecrement}
            disabled={value <= min}
          >
            <RemoveIcon fontSize="small" />
          </IconButton>
        )}
        <Typography
          variant="h5"
          sx={{ minWidth: 32, textAlign: "center" }}
          color={outcome ? outcomeColor[outcome] : undefined}
          fontWeight={outcome && outcome !== "par" ? 700 : undefined}
        >
          {recorded ? value : "-"}
        </Typography>
        {!readOnly && (
          <IconButton
            size="small"
            aria-label={`increase ${label.toLowerCase()}`}
            onClick={onIncrement}
          >
            <AddIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
