import { afterEach, describe, expect, it, vi } from "vitest";
import type { RoundDetail } from "./api";
import {
  buildShareCardData,
  canvasToBlob,
  drawShareCard,
  getCardSize,
  listShareCards,
  shareCardKey,
  shareCardLabel,
} from "./shareCard";

const baseRound: RoundDetail = {
  id: 1,
  createdAt: "2026-08-01 08:00:00",
  completedAt: "2026-08-01 10:30:00",
  counting: true,
  course: { id: 1, name: "Maple Hill" },
  layout: { id: 10, name: "Blue" },
  holes: [
    { id: 100, number: 1, par: 3, distanceMeters: 90 },
    { id: 101, number: 2, par: 4, distanceMeters: 120 },
  ],
  players: [
    { id: 1, name: "Alice" },
    { id: 2, name: "Bob" },
  ],
  scores: [
    {
      id: 1000,
      holeId: 100,
      playerId: 1,
      strokes: 2,
      penalties: 0,
      recorded: true,
    },
    {
      id: 1001,
      holeId: 101,
      playerId: 1,
      strokes: 3,
      penalties: 0,
      recorded: true,
    },
    {
      id: 1002,
      holeId: 100,
      playerId: 2,
      strokes: 4,
      penalties: 0,
      recorded: true,
    },
    {
      id: 1003,
      holeId: 101,
      playerId: 2,
      strokes: 5,
      penalties: 0,
      recorded: true,
    },
  ],
  weather: {
    temperatureCelsius: 14.2,
    windSpeedMs: 1.2,
    windDirectionDegrees: 208,
    symbolCode: "clearsky_day",
  },
};

describe("buildShareCardData", () => {
  it("sorts players best (lowest total) first", () => {
    const data = buildShareCardData(baseRound);
    expect(data.players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
    expect(data.players[0].total).toBe(5);
    expect(data.players[0].par).toBe(7);
    expect(data.players[1].total).toBe(9);
  });

  it("aligns each player's per-hole scores with the sorted hole order", () => {
    const data = buildShareCardData(baseRound);
    expect(data.holes.map((h) => h.number)).toEqual([1, 2]);
    expect(data.players[0].scores).toEqual([
      { strokes: 2, recorded: true },
      { strokes: 3, recorded: true },
    ]);
  });

  it("includes course, layout, and formatted date", () => {
    const data = buildShareCardData(baseRound);
    expect(data.courseName).toBe("Maple Hill");
    expect(data.layoutName).toBe("Blue");
    expect(data.dateLabel).toBe("01 Aug 2026 10:30");
  });

  it("falls back to createdAt when completedAt is null", () => {
    const data = buildShareCardData({ ...baseRound, completedAt: null });
    expect(data.dateLabel).toBe("01 Aug 2026 08:00");
  });

  it("formats a sunny weather label with an emoji", () => {
    const data = buildShareCardData(baseRound);
    expect(data.weatherLabel).toBe("☀️ 14°C · 1.2 m/s SSW");
  });

  it("omits the weather label when there's no weather data", () => {
    const data = buildShareCardData({ ...baseRound, weather: null });
    expect(data.weatherLabel).toBeNull();
  });
});

describe("listShareCards / shareCardLabel / shareCardKey", () => {
  it("lists the full scorecard followed by one card per player", () => {
    const data = buildShareCardData(baseRound);
    const cards = listShareCards(data);
    expect(cards).toEqual([
      { type: "full" },
      { type: "player", index: 0 },
      { type: "player", index: 1 },
    ]);
    expect(cards.map((kind) => shareCardLabel(kind, data))).toEqual([
      "Full scorecard",
      "Alice scorecard",
      "Bob scorecard",
    ]);
    expect(cards.map(shareCardKey)).toEqual(["full", "player-0", "player-1"]);
  });
});

describe("getCardSize", () => {
  it("grows the full card with the player count", () => {
    const data = buildShareCardData(baseRound);
    const twoPlayers = getCardSize({ type: "full" }, data);
    const onePlayer = getCardSize(
      { type: "full" },
      { ...data, players: data.players.slice(0, 1) },
    );
    expect(twoPlayers.height).toBeGreaterThan(onePlayer.height);
  });

  it("keeps player cards a near-fixed size regardless of roster size", () => {
    const data = buildShareCardData(baseRound);
    const size = getCardSize({ type: "player", index: 0 }, data);
    expect(size.width).toBe(1080);
    expect(size.height).toBeGreaterThan(0);
  });
});

describe("drawShareCard", () => {
  const fakeContext = {
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 10 })),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 0,
    font: "",
    textAlign: "left",
    textBaseline: "alphabetic",
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("draws the full card and every player card without throwing", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      fakeContext as unknown as CanvasRenderingContext2D,
    );
    const canvas = document.createElement("canvas");
    const data = buildShareCardData(baseRound);

    for (const kind of listShareCards(data)) {
      fakeContext.fillText.mockClear();
      expect(() => drawShareCard(canvas, kind, data)).not.toThrow();
      expect(fakeContext.fillText).toHaveBeenCalled();
    }
  });

  it("does nothing when the canvas has no 2d context", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    const data = buildShareCardData(baseRound);

    expect(() => drawShareCard(canvas, { type: "full" }, data)).not.toThrow();
  });
});

describe("canvasToBlob", () => {
  it("resolves with the blob produced by canvas.toBlob", async () => {
    const blob = new Blob(["fake"], { type: "image/png" });
    const canvas = document.createElement("canvas");
    vi.spyOn(canvas, "toBlob").mockImplementation((callback) => {
      callback(blob);
    });

    await expect(canvasToBlob(canvas)).resolves.toBe(blob);
  });
});
