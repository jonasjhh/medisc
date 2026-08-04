import type { RoundDetail } from "./api";
import { formatDateTime } from "../shared/formatDateTime";
import { badgeColors, scoreOutcome } from "./scoreColor";
import { formatWeather } from "./weather";

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
  const holes = sortedHoles.map((h) => ({ number: h.number, par: h.par }));

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

const BRAND = {
  green: "#2e6e4e",
  greenLight: "#7bc99a",
  dark: "#121212",
  panel: "#1e1e1e",
  divider: "#333a30",
  ink: "#f2f4ef",
  mutedInk: "#9aa79c",
};

export const CARD_WIDTH = 1080;
const MARGIN_X = 56;
const TOT_COL_WIDTH = 108;
const FOOTER_HEIGHT = 96;

// Hole columns shrink to fit however many holes the round has, so an
// 18-hole layout and a 9-hole one both render as one row instead of
// wrapping — matches how the card stays legible at share-image scale.
function holeColWidth(holeCount: number, labelColWidth: number): number {
  const available = CARD_WIDTH - MARGIN_X * 2 - labelColWidth - TOT_COL_WIDTH;
  return Math.max(30, available / Math.max(1, holeCount));
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  s: number,
  y: number,
) {
  const height = FOOTER_HEIGHT * s;
  const gradient = ctx.createLinearGradient(0, y, CARD_WIDTH * s, y);
  gradient.addColorStop(0, BRAND.green);
  gradient.addColorStop(1, "#1d4b34");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, y, CARD_WIDTH * s, height);

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${26 * s}px system-ui, sans-serif`;
  const left = [data.dateLabel, data.weatherLabel]
    .filter(Boolean)
    .join("  ·  ");
  ctx.fillText(left, MARGIN_X * s, y + height / 2);

  ctx.textAlign = "right";
  ctx.font = `700 ${30 * s}px system-ui, sans-serif`;
  ctx.fillText("MEDISC", CARD_WIDTH * s - MARGIN_X * s, y + height / 2);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
}

function drawScoreBadge(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  diameter: number,
  strokes: number,
  par: number,
  recorded: boolean,
  s: number,
) {
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (!recorded) {
    ctx.fillStyle = BRAND.mutedInk;
    ctx.font = `${Math.max(16, diameter * 0.5)}px system-ui, sans-serif`;
    ctx.fillText("–", centerX, centerY + 1 * s);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    return;
  }
  const outcome = scoreOutcome(strokes, par);
  if (outcome === "par") {
    ctx.fillStyle = BRAND.ink;
    ctx.font = `600 ${Math.max(16, diameter * 0.52)}px system-ui, sans-serif`;
    ctx.fillText(`${strokes}`, centerX, centerY + 1 * s);
  } else {
    const colors = badgeColors[outcome].dark;
    ctx.fillStyle = colors.background;
    ctx.beginPath();
    ctx.arc(centerX, centerY, diameter / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.text;
    ctx.font = `700 ${Math.max(16, diameter * 0.5)}px system-ui, sans-serif`;
    ctx.fillText(`${strokes}`, centerX, centerY + 1 * s);
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
  s: number,
  height: number,
) {
  ctx.fillStyle = BRAND.dark;
  ctx.fillRect(0, 0, CARD_WIDTH * s, height * s);

  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${26 * s}px system-ui, sans-serif`;
  ctx.fillText("Full scorecard", MARGIN_X * s, 70 * s);

  ctx.fillStyle = BRAND.ink;
  ctx.font = `700 ${48 * s}px system-ui, sans-serif`;
  ctx.fillText(
    truncateToWidth(ctx, data.courseName, CARD_WIDTH * s - MARGIN_X * 2 * s),
    MARGIN_X * s,
    130 * s,
  );
  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${28 * s}px system-ui, sans-serif`;
  ctx.fillText(data.layoutName, MARGIN_X * s, 168 * s);

  const labelColWidth = 220;
  const colWidth = holeColWidth(data.holes.length, labelColWidth) * s;
  const startX = (MARGIN_X + labelColWidth) * s;
  const totX = startX + colWidth * data.holes.length + (TOT_COL_WIDTH / 2) * s;

  const headerY = 230 * s;
  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${18 * s}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("HOLE", MARGIN_X * s, headerY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, headerY, colWidth, (hole, cx, cy) => {
    ctx.fillText(`${hole.number}`, cx, cy);
  });
  ctx.fillText("TOT", totX, headerY);

  const parY = headerY + 30 * s;
  ctx.textAlign = "left";
  ctx.fillText("PAR", MARGIN_X * s, parY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, parY, colWidth, (hole, cx, cy) => {
    ctx.fillText(`${hole.par}`, cx, cy);
  });

  ctx.strokeStyle = BRAND.divider;
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  ctx.moveTo(MARGIN_X * s, parY + 16 * s);
  ctx.lineTo(CARD_WIDTH * s - MARGIN_X * s, parY + 16 * s);
  ctx.stroke();

  const rowHeight = 62 * s;
  const badgeDiameter = Math.min(colWidth * 0.7, 40 * s);
  const firstRowY = parY + 16 * s + rowHeight / 2 + 16 * s;

  data.players.forEach((player, index) => {
    const rowY = firstRowY + index * rowHeight;
    if (index === 0) {
      ctx.fillStyle = BRAND.panel;
      ctx.fillRect(0, rowY - rowHeight / 2, CARD_WIDTH * s, rowHeight);
    }

    ctx.textAlign = "left";
    ctx.fillStyle = index === 0 ? BRAND.greenLight : BRAND.ink;
    ctx.font = `600 ${26 * s}px system-ui, sans-serif`;
    ctx.fillText(
      truncateToWidth(ctx, player.name, labelColWidth * s - 16 * s),
      MARGIN_X * s,
      rowY + 8 * s,
    );

    drawHoleRow(data.holes, startX, rowY, colWidth, (hole, cx, cy) => {
      const score = player.scores[data.holes.indexOf(hole)];
      drawScoreBadge(
        ctx,
        cx,
        cy,
        badgeDiameter,
        score.strokes,
        hole.par,
        score.recorded,
        s,
      );
    });

    ctx.textAlign = "center";
    ctx.fillStyle = BRAND.ink;
    ctx.font = `700 ${26 * s}px system-ui, sans-serif`;
    ctx.fillText(`${player.total}`, totX, rowY - 6 * s);
    ctx.fillStyle = BRAND.mutedInk;
    ctx.font = `${18 * s}px system-ui, sans-serif`;
    ctx.fillText(relativeToPar(player.total, player.par), totX, rowY + 16 * s);
    ctx.textAlign = "left";
  });

  drawFooter(ctx, data, s, height * s - FOOTER_HEIGHT * s);
}

function drawSegmentedBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  segments: { count: number; color: string }[],
  s: number,
) {
  const total = segments.reduce((sum, seg) => sum + seg.count, 0);
  if (total === 0) {
    ctx.fillStyle = BRAND.divider;
    ctx.fillRect(x, y, width, height);
    return;
  }
  let cursor = x;
  const gap = 3 * s;
  segments.forEach((seg) => {
    if (seg.count === 0) {
      return;
    }
    const segWidth = (seg.count / total) * width;
    ctx.fillStyle = seg.color;
    ctx.fillRect(cursor, y, Math.max(0, segWidth - gap), height);
    if (segWidth > 30 * s) {
      ctx.fillStyle = "#121212";
      ctx.textAlign = "center";
      ctx.font = `700 ${16 * s}px system-ui, sans-serif`;
      ctx.fillText(
        `${seg.count}`,
        cursor + segWidth / 2,
        y + height / 2 + 5 * s,
      );
      ctx.textAlign = "left";
    }
    cursor += segWidth;
  });
}

function drawPlayerCard(
  ctx: CanvasRenderingContext2D,
  data: ShareCardData,
  playerIndex: number,
  s: number,
  height: number,
) {
  const player = data.players[playerIndex];

  ctx.fillStyle = BRAND.dark;
  ctx.fillRect(0, 0, CARD_WIDTH * s, height * s);

  const avatarR = 44 * s;
  const avatarCx = (MARGIN_X + 44) * s;
  const avatarCy = 110 * s;
  ctx.fillStyle = BRAND.green;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${44 * s}px system-ui, sans-serif`;
  ctx.fillText(player.name.charAt(0).toUpperCase(), avatarCx, avatarCy + 2 * s);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const textX = (MARGIN_X + 44 + 60) * s;
  ctx.fillStyle = BRAND.ink;
  ctx.font = `700 ${36 * s}px system-ui, sans-serif`;
  ctx.fillText(
    truncateToWidth(ctx, player.name, CARD_WIDTH * s - textX - 260 * s),
    textX,
    avatarCy - 6 * s,
  );
  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${26 * s}px system-ui, sans-serif`;
  ctx.fillText(
    truncateToWidth(ctx, data.courseName, CARD_WIDTH * s - textX - 260 * s),
    textX,
    avatarCy + 30 * s,
  );

  const diff = player.total - player.par;
  const scoreDiff = relativeToPar(player.total, player.par);
  ctx.textAlign = "right";
  ctx.fillStyle =
    diff < 0
      ? BRAND.greenLight
      : diff > 0
        ? badgeColors.bogey.dark.background
        : BRAND.ink;
  ctx.font = `700 ${52 * s}px system-ui, sans-serif`;
  ctx.fillText(
    `${scoreDiff} (${player.total})`,
    CARD_WIDTH * s - MARGIN_X * s,
    avatarCy + 8 * s,
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

  const statsY = 210 * s;
  const donutR = 44 * s;
  ctx.save();
  ctx.translate(MARGIN_X * s + donutR, statsY + donutR);
  ctx.lineWidth = 8 * s;
  ctx.strokeStyle = BRAND.divider;
  ctx.beginPath();
  ctx.arc(0, 0, donutR - 4 * s, 0, Math.PI * 2);
  ctx.stroke();
  if (birdiePct > 0) {
    ctx.strokeStyle = BRAND.greenLight;
    ctx.beginPath();
    ctx.arc(
      0,
      0,
      donutR - 4 * s,
      -Math.PI / 2,
      -Math.PI / 2 + (birdiePct / 100) * Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.fillStyle = BRAND.ink;
  ctx.font = `700 ${20 * s}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${birdiePct}%`, 0, 0);
  ctx.restore();

  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${20 * s}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("BIRDIES", MARGIN_X * s + donutR, statsY + donutR * 2 + 26 * s);
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const barX = (MARGIN_X + donutR * 2 + 32) * s;
  const barWidth = CARD_WIDTH * s - barX - MARGIN_X * s;
  drawSegmentedBar(
    ctx,
    barX,
    statsY + donutR - 14 * s,
    barWidth,
    28 * s,
    [
      { count: under, color: badgeColors.birdie.dark.background },
      { count: par, color: BRAND.divider },
      { count: over, color: badgeColors.bogey.dark.background },
    ],
    s,
  );

  const holeLabelWidth = 84;
  const holeSectionY = statsY + donutR * 2 + 70 * s;
  const colWidth = holeColWidth(data.holes.length, holeLabelWidth) * s;
  const startX = (MARGIN_X + holeLabelWidth) * s;

  ctx.fillStyle = BRAND.mutedInk;
  ctx.font = `${18 * s}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.fillText("HOLE", MARGIN_X * s, holeSectionY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, holeSectionY, colWidth, (hole, cx, cy) =>
    ctx.fillText(`${hole.number}`, cx, cy),
  );

  const parRowY = holeSectionY + 30 * s;
  ctx.textAlign = "left";
  ctx.fillText("PAR", MARGIN_X * s, parRowY);
  ctx.textAlign = "center";
  drawHoleRow(data.holes, startX, parRowY, colWidth, (hole, cx, cy) =>
    ctx.fillText(`${hole.par}`, cx, cy),
  );

  const scoreRowY = parRowY + 46 * s;
  const badgeDiameter = Math.min(colWidth * 0.72, 44 * s);
  drawHoleRow(data.holes, startX, scoreRowY, colWidth, (hole, cx, cy) => {
    const score = player.scores[data.holes.indexOf(hole)];
    drawScoreBadge(
      ctx,
      cx,
      cy,
      badgeDiameter,
      score.strokes,
      hole.par,
      score.recorded,
      s,
    );
  });

  drawFooter(ctx, data, s, height * s - FOOTER_HEIGHT * s);
}

// Natural (unscaled, CARD_WIDTH-relative) card size. The full card grows
// with player count (one row each); a player card is a near-fixed height
// regardless of roster size, since it only ever shows one row of holes.
export function getCardSize(
  kind: ShareCardKind,
  data: ShareCardData,
): { width: number; height: number } {
  if (kind.type === "full") {
    const headerHeight = 260;
    const rowHeight = 62;
    const height =
      headerHeight + data.players.length * rowHeight + FOOTER_HEIGHT + 20;
    return { width: CARD_WIDTH, height: Math.max(400, Math.round(height)) };
  }
  return { width: CARD_WIDTH, height: 560 };
}

// width lets callers render the identical design at any resolution (a
// small live thumbnail vs. the full-size shareable image) from one source
// of truth — every metric above is authored for CARD_WIDTH and scaled by
// width / CARD_WIDTH; height follows from getCardSize().
export function drawShareCard(
  canvas: HTMLCanvasElement,
  kind: ShareCardKind,
  data: ShareCardData,
  width: number = CARD_WIDTH,
) {
  const natural = getCardSize(kind, data);
  const scale = width / natural.width;
  const height = Math.round(natural.height * scale);
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  if (kind.type === "full") {
    drawFullCard(ctx, data, scale, natural.height);
  } else {
    drawPlayerCard(ctx, data, kind.index, scale, natural.height);
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}
