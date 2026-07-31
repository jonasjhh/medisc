import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { scoreOutcome } from "./scoreColor";

// Contrast ratios against the theme's success/warning backgrounds
// (src/app/theme.ts):
//   success light #2e7d32 vs white 5.13:1 (pass)
//   success dark  #66bb6a vs white 2.36:1 (fail), vs black 8.88:1 (pass)
//   warning light #c56a00 vs white 3.86:1 (fails AA for normal-size text), vs black 5.44:1 (pass)
//   warning dark  #ffa726 vs white 1.94:1 (fail), vs black 10.81:1 (pass)
// Only birdie/light keeps white text — every other filled combination needs
// dark text, so this can't be a single fixed color per outcome.
const badgeTextColor: Record<
  "light" | "dark",
  { birdie: string; bogey: string }
> = {
  light: { birdie: "#ffffff", bogey: "#1a1a1a" },
  dark: { birdie: "#0b2016", bogey: "#1a1a1a" },
};

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

  const bgcolor =
    outcome === "birdie"
      ? theme.palette.success.main
      : outcome === "bogey"
        ? theme.palette.warning.main
        : undefined;
  const color =
    outcome === "par" ? "text.primary" : badgeTextColor[mode][outcome];

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
        bgcolor,
        color,
        fontWeight: outcome === "par" ? 400 : 700,
        fontSize: "0.75rem",
        lineHeight: 1,
      }}
    >
      {recorded ? strokes : "-"}
    </Box>
  );
}
