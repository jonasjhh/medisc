import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { badgeColors } from "../rounds/scoreColor";
import type { ScoreOutcome } from "../rounds/scoreColor";
import type { ScoreDistribution } from "./api";

const ROWS: { outcome: ScoreOutcome; label: string }[] = [
  { outcome: "ace", label: "Ace" },
  { outcome: "eagle", label: "Eagle" },
  { outcome: "birdie", label: "Birdie" },
  { outcome: "par", label: "Par" },
  { outcome: "bogey", label: "Bogey" },
  { outcome: "doubleBogey", label: "Double bogey" },
  { outcome: "worse", label: "Triple bogey+" },
];

export function ScoreDistributionChart({
  distribution,
}: {
  distribution: ScoreDistribution;
}) {
  const theme = useTheme();
  const mode = theme.palette.mode;
  const total = ROWS.reduce(
    (sum, { outcome }) => sum + distribution[outcome],
    0,
  );
  const max = Math.max(...ROWS.map(({ outcome }) => distribution[outcome]), 1);

  return (
    <Stack spacing={0.75} aria-label="Counting throw distribution">
      {ROWS.map(({ outcome, label }) => {
        const count = distribution[outcome];
        const pct = (count / max) * 100;
        const barColor =
          outcome === "par"
            ? theme.palette.grey[500]
            : badgeColors[outcome][mode].background;
        return (
          <Stack key={outcome} direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" sx={{ width: 100, flexShrink: 0 }}>
              {label}
            </Typography>
            <Box
              sx={{
                flexGrow: 1,
                height: 14,
                borderRadius: 1,
                bgcolor: "action.hover",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: "100%",
                  borderRadius: 1,
                  bgcolor: count > 0 ? barColor : "transparent",
                  transition: "width 0.2s ease",
                }}
              />
            </Box>
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ width: 28, textAlign: "right", flexShrink: 0 }}
            >
              {count}
            </Typography>
          </Stack>
        );
      })}
      <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
        {total} counting throw{total === 1 ? "" : "s"} recorded
      </Typography>
    </Stack>
  );
}
