import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { badgeColors, scoreOutcome } from "./scoreColor";

export function ScoreBadge({
  strokes,
  par,
  recorded = true,
}: {
  strokes: number;
  par: number;
  recorded?: boolean;
}) {
  const theme = useTheme();
  const outcome = scoreOutcome(strokes, par);
  const mode = theme.palette.mode;
  const colors = outcome === "par" ? undefined : badgeColors[outcome][mode];

  return (
    <Box
      component="span"
      data-testid="score-badge"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 22,
        height: 22,
        borderRadius: 0.75,
        bgcolor: colors?.background,
        color: colors?.text ?? "text.primary",
        fontWeight: colors ? 700 : 400,
        fontSize: "0.75rem",
        lineHeight: 1,
      }}
    >
      {recorded ? strokes : "-"}
    </Box>
  );
}
