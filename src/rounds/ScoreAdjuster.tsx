import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { alpha, useTheme } from "@mui/material/styles";
import type { Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { adjusterTextColors } from "./scoreColor";
import type { ScoreOutcome } from "./scoreColor";

// A filled circle rather than a bare icon: the tap target is what matters
// here, so it needs to read as a button at a glance, not just a glyph.
const adjusterButtonSx = (theme: Theme) => ({
  width: 40,
  height: 40,
  bgcolor: alpha(
    theme.palette.primary.main,
    theme.palette.mode === "dark" ? 0.24 : 0.12,
  ),
  color: theme.palette.primary.main,
  "&:hover": {
    bgcolor: alpha(
      theme.palette.primary.main,
      theme.palette.mode === "dark" ? 0.34 : 0.2,
    ),
  },
  "&.Mui-disabled": {
    bgcolor: "action.disabledBackground",
    color: "action.disabled",
  },
});

// Deliberately plainer than the primary adjuster (smaller, neutral instead
// of tinted primary): penalties is the rare edge-case input, so it should
// read as secondary to strokes rather than competing with it.
const compactAdjusterButtonSx = (theme: Theme) => ({
  width: 30,
  height: 30,
  bgcolor: theme.palette.action.selected,
  color: theme.palette.text.secondary,
  "&:hover": {
    bgcolor: theme.palette.action.hover,
  },
  "&.Mui-disabled": {
    bgcolor: "action.disabledBackground",
    color: "action.disabled",
  },
});

export function ScoreAdjuster({
  label,
  value,
  min,
  onDecrement,
  onIncrement,
  readOnly = false,
  outcome,
  recorded = true,
  size = "default",
}: {
  label: string;
  value: number;
  min: number;
  onDecrement: () => void;
  onIncrement: () => void;
  readOnly?: boolean;
  outcome?: ScoreOutcome;
  recorded?: boolean;
  size?: "default" | "compact";
}) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const compact = size === "compact";
  const color =
    outcome && outcome !== "par"
      ? adjusterTextColors[outcome][mode]
      : undefined;

  return (
    <Box textAlign="center">
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Box
        display="flex"
        alignItems="center"
        gap={compact ? 1 : 1.5}
        sx={{ minHeight: 40 }}
      >
        {!readOnly && (
          <IconButton
            aria-label={`decrease ${label.toLowerCase()}`}
            onClick={onDecrement}
            disabled={value <= min}
            sx={
              compact ? compactAdjusterButtonSx(theme) : adjusterButtonSx(theme)
            }
          >
            <RemoveIcon fontSize={compact ? "small" : "medium"} />
          </IconButton>
        )}
        <Typography
          variant={compact ? "body1" : "h6"}
          color={compact ? "text.secondary" : undefined}
          sx={{ minWidth: compact ? 20 : 28, textAlign: "center", color }}
          fontWeight={outcome && outcome !== "par" ? 700 : undefined}
        >
          {recorded ? value : "-"}
        </Typography>
        {!readOnly && (
          <IconButton
            aria-label={`increase ${label.toLowerCase()}`}
            onClick={onIncrement}
            sx={
              compact ? compactAdjusterButtonSx(theme) : adjusterButtonSx(theme)
            }
          >
            <AddIcon fontSize={compact ? "small" : "medium"} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}
