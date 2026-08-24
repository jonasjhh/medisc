import { PROCESSING_HEIGHT, PROCESSING_WIDTH } from "./constants";
import type { FrameSample } from "./types";

const DIFF_THRESHOLD = 28; // per-pixel luma change to count as "moved"
const MIN_FOREGROUND_PIXELS = 25; // ignore sensor noise / tiny flicker

// Frame-differencing motion detector: draws each video frame onto a small
// canvas, compares it (in grayscale) against the previous frame, and
// reports the bounding box/centroid of whatever changed. A disc flying
// over a static background (sky, ceiling, floor) is the only thing that
// should move, so this is a cheap and reliable enough detector without
// needing real object recognition.
export class FrameAnalyzer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private previousLuma: Uint8ClampedArray | null = null;
  private lastVideoTime = -1;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = PROCESSING_WIDTH;
    this.canvas.height = PROCESSING_HEIGHT;
    const ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  /**
   * Call once per animation frame. Returns null when the video hasn't
   * produced a new frame yet, or when nothing moved enough to matter.
   */
  sample(video: HTMLVideoElement, now: number): FrameSample | null {
    if (video.readyState < 2) return null;
    if (video.currentTime === this.lastVideoTime) return null;
    this.lastVideoTime = video.currentTime;

    this.ctx.drawImage(video, 0, 0, PROCESSING_WIDTH, PROCESSING_HEIGHT);
    const { data } = this.ctx.getImageData(
      0,
      0,
      PROCESSING_WIDTH,
      PROCESSING_HEIGHT,
    );

    const luma = new Uint8ClampedArray(PROCESSING_WIDTH * PROCESSING_HEIGHT);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      luma[p] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    const previous = this.previousLuma;
    this.previousLuma = luma;
    if (!previous) return null;

    let minX = PROCESSING_WIDTH;
    let maxX = -1;
    let minY = PROCESSING_HEIGHT;
    let maxY = -1;
    let sumX = 0;
    let sumY = 0;
    let count = 0;

    for (let y = 0; y < PROCESSING_HEIGHT; y++) {
      const rowOffset = y * PROCESSING_WIDTH;
      for (let x = 0; x < PROCESSING_WIDTH; x++) {
        const idx = rowOffset + x;
        if (Math.abs(luma[idx] - previous[idx]) > DIFF_THRESHOLD) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
          sumX += x;
          sumY += y;
          count++;
        }
      }
    }

    if (count < MIN_FOREGROUND_PIXELS) return null;

    return {
      t: now,
      cx: sumX / count,
      cy: sumY / count,
      width: maxX - minX + 1,
      height: maxY - minY + 1,
      pixelCount: count,
    };
  }

  reset() {
    this.previousLuma = null;
    this.lastVideoTime = -1;
  }
}
