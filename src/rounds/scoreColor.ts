export type ScoreOutcome =
  | "ace"
  | "albatross"
  | "eagle"
  | "birdie"
  | "par"
  | "bogey"
  | "doubleBogey"
  | "worse";

// An ace (hole-in-one) always gets its own color regardless of how far
// under par it happens to be. Otherwise buckets are purely relative to par:
// 3+ under is an albatross, 2 under an eagle, 1 under a birdie, 1/2 over a
// bogey/double bogey, and 3+ over is lumped into "worse" (triple bogey or
// beyond).
export function scoreOutcome(strokes: number, par: number): ScoreOutcome {
  if (strokes === 1) {
    return "ace";
  }
  if (strokes <= par - 3) {
    return "albatross";
  }
  if (strokes === par - 2) {
    return "eagle";
  }
  if (strokes === par - 1) {
    return "birdie";
  }
  if (strokes === par) {
    return "par";
  }
  if (strokes === par + 1) {
    return "bogey";
  }
  if (strokes === par + 2) {
    return "doubleBogey";
  }
  return "worse";
}

type Mode = "light" | "dark";
type ColoredOutcome = Exclude<ScoreOutcome, "par">;

interface ColorPair {
  background: string;
  text: string;
}

// Badge fill (background) + contrasting text, used by ScoreBadge's colored
// squares. Every pair clears WCAG AA (>=4.5:1) for its background/text
// combination; see contrast ratios noted per entry.
export const badgeColors: Record<ColoredOutcome, Record<Mode, ColorPair>> = {
  ace: {
    light: { background: "#1976d2", text: "#ffffff" }, // 4.60:1
    dark: { background: "#64b5f6", text: "#1a1a1a" }, // 7.86:1
  },
  // Teal, deliberately between ace's blue and eagle's green — an albatross
  // (3 under) sits between them in rarity too.
  albatross: {
    light: { background: "#00796b", text: "#ffffff" }, // 5.32:1
    dark: { background: "#4db6ac", text: "#1a1a1a" }, // 7.13:1
  },
  eagle: {
    light: { background: "#2e7d32", text: "#ffffff" }, // 5.13:1
    dark: { background: "#4caf50", text: "#1a1a1a" }, // 6.26:1
  },
  birdie: {
    light: { background: "#66bb6a", text: "#1a1a1a" }, // 7.36:1
    dark: { background: "#a5d6a7", text: "#1a1a1a" }, // 10.59:1
  },
  bogey: {
    light: { background: "#ffb74d", text: "#1a1a1a" }, // 10.06:1
    dark: { background: "#ffcc80", text: "#1a1a1a" }, // 11.77:1
  },
  doubleBogey: {
    light: { background: "#fb8c00", text: "#1a1a1a" }, // 7.34:1
    dark: { background: "#ff9800", text: "#1a1a1a" }, // 8.08:1
  },
  worse: {
    light: { background: "#bf360c", text: "#ffffff" }, // 5.60:1
    dark: { background: "#ff7043", text: "#1a1a1a" }, // 6.34:1
  },
};

// Plain foreground text color (no fill), used by ScoreAdjuster's large digit
// against the page background. Dark mode can reuse the badge backgrounds
// directly (they're light tints that already read fine on a dark page), but
// light mode needs distinctly darker shades than the badge fill colors,
// which are tuned for legibility as a background rather than as text on a
// near-white page — reusing them here would fail contrast.
export const adjusterTextColors: Record<
  ColoredOutcome,
  Record<Mode, string>
> = {
  ace: {
    light: "#1565c0", // 5.35:1 on #f6f7f5
    dark: badgeColors.ace.dark.background, // 8.46:1 on #121212
  },
  albatross: {
    light: "#00695c", // 6.15:1 on #f6f7f5
    dark: badgeColors.albatross.dark.background, // 7.67:1 on #121212
  },
  eagle: {
    light: "#1b5e20", // 7.32:1
    dark: badgeColors.eagle.dark.background, // 6.74:1
  },
  birdie: {
    light: "#2e7d32", // 4.77:1
    dark: badgeColors.birdie.dark.background, // 11.40:1
  },
  bogey: {
    light: "#c1440d", // 4.77:1
    dark: badgeColors.bogey.dark.background, // 12.67:1
  },
  doubleBogey: {
    light: "#a8380c", // 6.04:1
    dark: badgeColors.doubleBogey.dark.background, // 8.69:1
  },
  worse: {
    light: "#7f0000", // 10.27:1
    dark: badgeColors.worse.dark.background, // 6.83:1
  },
};
