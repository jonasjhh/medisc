import type { RoundDetail } from "./api";
import { formatDateTime } from "../shared/formatDateTime";
import { adjusterTextColors, badgeColors, scoreOutcome } from "./scoreColor";
import { formatWeather } from "./weather";

export type CardMode = "light" | "dark";

// Mirrors udisc's "share scorecard" sheet: one card holding the full
// scorecard for every player, then one stats card per player. Not a fixed
// set of design "themes" — the list is derived from the round's roster.
export type ShareCardKind =
  { type: "full" } | { type: "player"; index: number };

export function listShareCards(data: ShareCardData): ShareCardKind[] {
  return [
    { type: "full" },
    ...data.players.map((_, index) => ({ type: "player" as const, index })),
  ];
}

export function shareCardKey(kind: ShareCardKind): string {
  return kind.type === "full" ? "full" : `player-${kind.index}`;
}

export function shareCardLabel(
  kind: ShareCardKind,
  data: ShareCardData,
): string {
  if (kind.type === "full") {
    return "Full scorecard";
  }
  return `${data.players[kind.index].name} scorecard`;
}

export interface ShareCardHole {
  number: number;
  par: number;
  distanceMeters: number | null;
}

export interface ShareCardPlayerScore {
  strokes: number;
  recorded: boolean;
}

export interface ShareCardPlayer {
  name: string;
  total: number;
  par: number;
  scores: ShareCardPlayerScore[]; // aligned index-wise with ShareCardData.holes
}

export interface ShareCardData {
  courseName: string;
  layoutName: string;
  dateLabel: string;
  weatherLabel: string | null;
  holes: ShareCardHole[];
  players: ShareCardPlayer[]; // sorted best (lowest total) first
}

// yr.no symbol codes look like "partlycloudy_day" — bucket by keyword
// rather than enumerating all ~30 codes, same grouping as weatherIcon() in
// weather.ts but returning an emoji glyph canvas can draw directly instead
// of an MUI icon component.
function weatherEmoji(symbolCode: string | null): string {
  if (!symbolCode) {
    return "☁️";
  }
  const base = symbolCode.replace(/_(day|night|polartwilight)$/, "");
  if (base === "clearsky" || base === "fair") {
    return symbolCode.endsWith("_night") ? "🌙" : "☀️";
  }
  if (base.includes("thunder")) {
    return "⛈️";
  }
  if (base.includes("snow") || base.includes("sleet")) {
    return "❄️";
  }
  if (base.includes("rain")) {
    return "🌧️";
  }
  return "☁️";
}

// Course-level totals (not any one player's) — null-tolerant on distance the
// same way CoursesPage's layoutTotals() is, since older holes may have no
// recorded length.
function courseTotals(holes: ShareCardHole[]): {
  totalPar: number;
  totalMeters: number | null;
} {
  const totalPar = holes.reduce((sum, h) => sum + h.par, 0);
  const knownDistances = holes.filter((h) => h.distanceMeters !== null);
  const totalMeters =
    knownDistances.length > 0
      ? knownDistances.reduce((sum, h) => sum + (h.distanceMeters ?? 0), 0)
      : null;
  return { totalPar, totalMeters };
}

function relativeToPar(total: number, par: number): string {
  const diff = total - par;
  if (diff === 0) {
    return "E";
  }
  return diff > 0 ? `+${diff}` : `${diff}`;
}

export function buildShareCardData(round: RoundDetail): ShareCardData {
  const sortedHoles = [...round.holes].sort((a, b) => a.number - b.number);
  const holeNumberById = new Map(sortedHoles.map((h) => [h.id, h.number]));
  const holes = sortedHoles.map((h) => ({
    number: h.number,
    par: h.par,
    distanceMeters: h.distanceMeters,
  }));

  const players = round.players
    .map((player) => {
      const scoreByHoleNumber = new Map(
        round.scores
          .filter((score) => score.playerId === player.id)
          .map((score) => [holeNumberById.get(score.holeId), score]),
      );
      const scores = holes.map((hole) => {
        const score = scoreByHoleNumber.get(hole.number);
        return {
          strokes: score?.strokes ?? 0,
          recorded: score?.recorded ?? false,
        };
      });
      const par = holes.reduce((sum, h) => sum + h.par, 0);
      const total = scores.reduce(
        (sum, s) => (s.recorded ? sum + s.strokes : sum),
        0,
      );
      return { name: player.name, total, par, scores };
    })
    .sort((a, b) => a.total - b.total);

  return {
    courseName: round.course.name,
    layoutName: round.layout.name,
    dateLabel: formatDateTime(round.completedAt ?? round.createdAt),
    weatherLabel: round.weather
      ? `${weatherEmoji(round.weather.symbolCode)} ${formatWeather(round.weather)}`
      : null,
    holes,
    players,
  };
}

function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) {
    return text;
  }
  let truncated = text;
  while (
    truncated.length > 1 &&
    ctx.measureText(`${truncated}…`).width > maxWidth
  ) {
    truncated = truncated.slice(0, -1);
  }
  return `${truncated}…`;
}

interface Palette {
  background: string;
  divider: string;
  ink: string;
  mutedInk: string;
  green: string;
  accentText: string; // text-safe green (under-par scores)
}

// accentText reuses adjusterTextColors.birdie — it's already tuned per mode
// as plain foreground text (not a badge fill), which is exactly this use.
const PALETTES: Record<CardMode, Palette> = {
  dark: {
    background: "#121212",
    divider: "#333a30",
    ink: "#f2f4ef",
    mutedInk: "#9aa79c",
    green: "#2e6e4e",
    accentText: adjusterTextColors.birdie.dark,
  },
  light: {
    background: "#f6f7f5",
    divider: "#d8ddd4",
    ink: "#1a2117",
    mutedInk: "#55624f",
    green: "#2e6e4e",
    accentText: adjusterTextColors.birdie.light,
  },
};

export const CARD_WIDTH = 1080;
const MARGIN_X = 56;
const TOT_COL_WIDTH = 108;
const FOOTER_HEIGHT = 76;
// Breathing room between the last row of content and the footer bar —
// without this the footer sits flush against (or overlapping) the score
// row, since the card height was previously eyeballed instead of derived
// from where drawing actually ends.
const FOOTER_GAP = 28;

// Hole columns shrink to fit however many holes the round has, so an
// 18-hole layout and a 9-hole one both render as one row instead of
// wrapping — matches how the card stays legible at share-image scale.
function holeColWidth(holeCount: number, labelColWidth: number): number {
  const available = CARD_WIDTH - MARGIN_X * 2 - labelColWidth - TOT_COL_WIDTH;
  return Math.max(30, available / Math.max(1, holeCount));
}

// Unscaled y-positions for the full card — the single source of truth for
// both getCardSize() (how tall the card needs to be) and drawFullCard()
// (where things actually get drawn), so the two can't drift apart.
function fullCardLayout(playerCount: number) {
  const headerY = 230;
  const parY = headerY + 30;
  const dividerY = parY + 16;
  const rowHeight = 62;
  const firstRowY = dividerY + rowHeight / 2 + 16;
  const lastRowBottom =
    firstRowY + Math.max(0, playerCount - 1) * rowHeight + rowHeight / 2;
  return {
    headerY,
    parY,
    dividerY,
    rowHeight,
    firstRowY,
    contentBottom: lastRowBottom + FOOTER_GAP,
  };
}

// Unscaled y-positions for a player card — see fullCardLayout().
function playerCardLayout() {
  const statsY = 210;
  const donutR = 44;
  const holeLabelWidth = 84;
  const holeSectionY = statsY + donutR * 2 + 70;
  const parRowY = holeSectionY + 30;
  const scoreRowY = parRowY + 46;
  const badgeRadius = 22;
  return {
    statsY,
    donutR,
    holeLabelWidth,
    holeSectionY,
    parRowY,
    scoreRowY,
    contentBottom: scoreRowY + badgeRadius + FOOTER_GAP,
  };
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  palette: Palette,
  y: number,
) {
  const gradient = ctx.createLinearGradient(0, y, CARD_WIDTH, y);
  gradient.addColorStop(0, palette.green);
  gradient.addColorStop(1, "#1d4b34");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, CARD_WIDTH, FOOTER_HEIGHT);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = "600 26px system-ui, sans-serif";
  const left = [data.dateLabel, data.weatherLabel]
    .filter(Boolean)
    .join("  ·  ");
  ctx.fillText(left, MARGIN_X, y + FOOTER_HEIGHT / 2);

  ctx.textAlign = "right";
  ctx.font = "700 30px system-ui, sans-serif";
  ctx.fillText("MEDISC", CARD_WIDTH - MARGIN_X, y + FOOTER_HEIGHT / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawScoreBadge(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  mode: CardMode,
  centerX: number,
  centerY: number,
  diameter: number,
  strokes: number,
  par: number,
  recorded: boolean,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (!recorded) {
    ctx.fillStyle = palette.mutedInk;
    ctx.font = `${Math.max(16, diameter * 0.5)}px system-ui, sans-serif`;
    ctx.fillText("–", centerX, centerY + 1);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }
  const outcome = scoreOutcome(strokes, par);
  if (outcome === "par") {
    ctx.fillStyle = palette.ink;
    ctx.font = `600 ${Math.max(16, diameter * 0.52)}px system-ui, sans-serif`;
    ctx.fillText(`${strokes}`, centerX, centerY + 1);
  } else {
    const colors = badgeColors[outcome][mode];
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(centerX, centerY, diameter / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.font = `700 ${Math.max(16, diameter * 0.5)}px system-ui, sans-serif`;
    ctx.fillText(`${strokes}`, centerX, centerY + 1);
  }
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

// One row of hole-column values (numbers, pars, or a player's scores) at a
// fixed y, reused by both card kinds so the full card's player rows and the
// player card's own row line up under the same header.
function drawHoleRow(
  holes: ShareCardHole[],
  startX: number,
  y: number,
  colWidth: number,
  render: (hole: ShareCardHole, centerX: number, centerY: number) => void,
) {
  holes.forEach((hole, index) => {
    const centerX = startX + colWidth * (index + 0.5);
    render(hole, centerX, y);
  });
}

function drawFullCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  palette: Palette,
  mode: CardMode,
  height: number,
) {
  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, CARD_WIDTH, height);

  ctx.fillStyle = palette.ink;
  ctx.font = "700 48px system-ui, sans-serif";
  ctx.fillText(
    truncateToWidth(ctx, data.courseName, CARD_WIDTH - MARGIN_X * 2),
    MARGIN_X,
    80,
  );
  ctx.fillStyle = palette.mutedInk;
  ctx.font = "28px system-ui, sans-serif";
  ctx.fillText(data.layoutName, MARGIN_X, 120);

  const labelColWidth = 220;
  const colWidth = holeColWidth(data.holes.length, labelColWidth);
  const startX = MARGIN_X + labelColWidth;
  const totX = startX + colWidth * data.holes.length + TOT_COL_WIDTH / 2;

  const { totalPar, totalMeters } = courseTotals(data.holes);

  const layout = fullCardLayout(data.players.length);
  ctx.fillStyle = palette.mutedInk;
  ctx.font = "18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HOLE", MARGIN_X, layout.headerY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, layout.headerY, colWidth, (hole, cx, cy) => {
    ctx.fillText(`${hole.number}`, cx, cy);
  });
  // The TOT column's header cells carry the course's own totals (length,
  // par) rather than a plain "TOT" label — each player's own total sits
  // below in their row, so this is the one place a course-wide figure fits.
  ctx.fillText(
    totalMeters !== null ? `${totalMeters}m` : "TOT",
    totX,
    layout.headerY,
  );

  ctx.textAlign = "left";
  ctx.fillText("PAR", MARGIN_X, layout.parY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, layout.parY, colWidth, (hole, cx, cy) => {
    ctx.fillText(`${hole.par}`, cx, cy);
  });
  ctx.fillText(`${totalPar}`, totX, layout.parY);

  ctx.strokeStyle = palette.divider;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X, layout.dividerY);
  ctx.lineTo(CARD_WIDTH - MARGIN_X, layout.dividerY);
  ctx.stroke();

  const badgeDiameter = Math.min(colWidth * 0.7, 40);

  data.players.forEach((player, index) => {
    const rowY = layout.firstRowY + index * layout.rowHeight;

    ctx.textAlign = "left";
    ctx.fillStyle = palette.ink;
    ctx.font = "600 26px system-ui, sans-serif";
    ctx.fillText(
      truncateToWidth(ctx, player.name, labelColWidth - 16),
      MARGIN_X,
      rowY + 8,
    );

    drawHoleRow(data.holes, startX, rowY, colWidth, (hole, cx, cy) => {
      const score = player.scores[data.holes.indexOf(hole)];
      drawScoreBadge(
        ctx,
        palette,
        mode,
        cx,
        cy,
        badgeDiameter,
        score.strokes,
        hole.par,
        score.recorded,
      );
    });

    ctx.textAlign = "center";
    ctx.fillStyle = palette.ink;
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(`${player.total}`, totX, rowY - 6);
    ctx.fillStyle = palette.mutedInk;
    ctx.font = "18px system-ui, sans-serif";
    ctx.fillText(relativeToPar(player.total, player.par), totX, rowY + 16);
    ctx.textAlign = "left";
  });

  drawFooter(ctx, data, palette, layout.contentBottom);
}

function drawSegmentedBar(
  ctx: CanvasRenderingContext2D,
  palette: Palette,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: { count: number; color: string }[],
) {
  const total = segments.reduce((sum, seg) => sum + seg.count, 0);
  if (total === 0) {
    ctx.fillStyle = palette.divider;
    ctx.fillRect(x, y, width, height);
    return;
  }
  let cursor = x;
  const gap = 3;
  segments.forEach((seg) => {
    if (seg.count === 0) {
      return;
    }
    const segWidth = (seg.count / total) * width;
    ctx.fillStyle = seg.color;
    ctx.fillRect(cursor, y, Math.max(0, segWidth - gap), height);
    if (segWidth > 30) {
      ctx.fillStyle = "#121212";
      ctx.textAlign = "center";
      ctx.font = "700 16px system-ui, sans-serif";
      ctx.fillText(`${seg.count}`, cursor + segWidth / 2, y + height / 2 + 5);
      ctx.textAlign = "left";
    }
    cursor += segWidth;
  });
}

function drawPlayerCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  playerIndex: number,
  palette: Palette,
  mode: CardMode,
  height: number,
) {
  const player = data.players[playerIndex];

  ctx.fillStyle = palette.background;
  ctx.fillRect(0, 0, CARD_WIDTH, height);

  const avatarR = 44;
  const avatarCx = MARGIN_X + avatarR;
  const avatarCy = 110;
  ctx.fillStyle = palette.green;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 44px system-ui, sans-serif";
  ctx.fillText(player.name.charAt(0).toUpperCase(), avatarCx, avatarCy + 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const textX = MARGIN_X + avatarR * 2 + 32;
  ctx.fillStyle = palette.ink;
  ctx.font = "700 36px system-ui, sans-serif";
  ctx.fillText(
    truncateToWidth(ctx, player.name, CARD_WIDTH - textX - 260),
    textX,
    avatarCy - 6,
  );
  ctx.fillStyle = palette.mutedInk;
  ctx.font = "26px system-ui, sans-serif";
  ctx.fillText(
    truncateToWidth(ctx, data.courseName, CARD_WIDTH - textX - 260),
    textX,
    avatarCy + 30,
  );

  const diff = player.total - player.par;
  const scoreDiff = relativeToPar(player.total, player.par);
  ctx.textAlign = "right";
  ctx.fillStyle =
    diff < 0
      ? palette.accentText
      : diff > 0
        ? adjusterTextColors.bogey[mode]
        : palette.ink;
  ctx.font = "700 52px system-ui, sans-serif";
  ctx.fillText(
    `${scoreDiff} (${player.total})`,
    CARD_WIDTH - MARGIN_X,
    avatarCy + 8,
  );
  ctx.textAlign = "left";

  const outcomes = player.scores
    .filter((score) => score.recorded)
    .map((score, index) => scoreOutcome(score.strokes, data.holes[index].par));
  const under = outcomes.filter(
    (o) => o === "ace" || o === "eagle" || o === "birdie",
  ).length;
  const par = outcomes.filter((o) => o === "par").length;
  const over = outcomes.length - under - par;
  const birdiePct = outcomes.length
    ? Math.round((under / outcomes.length) * 100)
    : 0;

  const layout = playerCardLayout();
  ctx.save();
  ctx.translate(MARGIN_X + layout.donutR, layout.statsY + layout.donutR);
  ctx.lineWidth = 8;
  ctx.strokeStyle = palette.divider;
  ctx.beginPath();
  ctx.arc(0, 0, layout.donutR - 4, 0, Math.PI * 2);
  ctx.stroke();
  if (birdiePct > 0) {
    ctx.strokeStyle = palette.accentText;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      layout.donutR - 4,
      -Math.PI / 2,
      -Math.PI / 2 + (birdiePct / 100) * Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.fillStyle = palette.ink;
  ctx.font = "700 20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${birdiePct}%`, 0, 0);
  ctx.restore();

  ctx.fillStyle = palette.mutedInk;
  ctx.font = "20px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    "BIRDIES",
    MARGIN_X + layout.donutR,
    layout.statsY + layout.donutR * 2 + 26,
  );
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const barX = MARGIN_X + layout.donutR * 2 + 32;
  const barWidth = CARD_WIDTH - barX - MARGIN_X;
  drawSegmentedBar(
    ctx,
    palette,
    barX,
    layout.statsY + layout.donutR - 14,
    barWidth,
    28,
    [
      { count: under, color: badgeColors.birdie[mode].background },
      { count: par, color: palette.divider },
      { count: over, color: badgeColors.bogey[mode].background },
    ],
  );

  const colWidth = holeColWidth(data.holes.length, layout.holeLabelWidth);
  const startX = MARGIN_X + layout.holeLabelWidth;

  ctx.fillStyle = palette.mutedInk;
  ctx.font = "18px system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("HOLE", MARGIN_X, layout.holeSectionY);
  ctx.textAlign = "center";
  drawHoleRow(
    data.holes,
    startX,
    layout.holeSectionY,
    colWidth,
    (hole, cx, cy) => ctx.fillText(`${hole.number}`, cx, cy),
  );

  ctx.textAlign = "left";
  ctx.fillText("PAR", MARGIN_X, layout.parRowY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, layout.parRowY, colWidth, (hole, cx, cy) =>
    ctx.fillText(`${hole.par}`, cx, cy),
  );

  const badgeDiameter = Math.min(colWidth * 0.72, 44);
  drawHoleRow(
    data.holes,
    startX,
    layout.scoreRowY,
    colWidth,
    (hole, cx, cy) => {
      const score = player.scores[data.holes.indexOf(hole)];
      drawScoreBadge(
        ctx,
        palette,
        mode,
        cx,
        cy,
        badgeDiameter,
        score.strokes,
        hole.par,
        score.recorded,
      );
    },
  );

  drawFooter(ctx, data, palette, layout.contentBottom);
}

// Card size in CSS/canvas pixels — every draw function above works in
// these same absolute units (no scale factor), so the on-screen preview
// and the shared/downloaded image are always the identical bitmap, just
// displayed at different CSS sizes. That's what guarantees they match:
// there's only one rendering, never two independently-scaled ones.
export function getCardSize(
  kind: ShareCardKind,
  data: ShareCardData,
): { width: number; height: number } {
  if (kind.type === "full") {
    return {
      width: CARD_WIDTH,
      height: Math.max(
        400,
        Math.round(
          fullCardLayout(data.players.length).contentBottom + FOOTER_HEIGHT,
        ),
      ),
    };
  }
  return {
    width: CARD_WIDTH,
    height: Math.round(playerCardLayout().contentBottom + FOOTER_HEIGHT),
  };
}

export function drawShareCard(
  canvas: HTMLCanvasElement,
  kind: ShareCardKind,
  data: ShareCardData,
  mode: CardMode,
) {
  const size = getCardSize(kind, data);
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const palette = PALETTES[mode];
  if (kind.type === "full") {
    drawFullCard(ctx, data, palette, mode, size.height);
  } else {
    drawPlayerCard(ctx, data, kind.index, palette, mode, size.height);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
