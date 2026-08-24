import { PROCESSING_HEIGHT, PROCESSING_WIDTH } from "../detection/constants";
import type { FrameSample, PassEvent } from "../detection/types";

export interface SpeedResult {
  speedMps: number;
  frameCount: number;
  durationMs: number;
}

interface Position3D {
  t: number;
  x: number;
  y: number;
  z: number;
}

// Pinhole camera model: a disc's known real diameter plus its apparent
// width in pixels gives its distance from the camera at that instant
// (z = realDiameter * focalLength / apparentWidth); that distance plus the
// pixel offset from the image center then gives its real x/y position.
// Doing this per frame turns a sequence of 2D pixel measurements into a
// sequence of 3D positions we can measure real-world speed from.
function toPositions(
  frames: FrameSample[],
  focalLengthPx: number,
  discDiameterM: number,
): Position3D[] {
  const cx = PROCESSING_WIDTH / 2;
  const cy = PROCESSING_HEIGHT / 2;
  return frames
    .filter((f) => f.width > 0)
    .map((f) => {
      const z = (discDiameterM * focalLengthPx) / f.width;
      return {
        t: f.t,
        x: ((f.cx - cx) * z) / focalLengthPx,
        y: ((f.cy - cy) * z) / focalLengthPx,
        z,
      };
    });
}

// Speed is measured from the straight-line 3D displacement between the
// first and last frame of the event, divided by elapsed time — a simple,
// noise-tolerant average rather than differentiating every consecutive
// frame pair (which would amplify pixel-measurement jitter).
export function computeSpeed(
  event: PassEvent,
  focalLengthPx: number,
  discDiameterM: number,
): SpeedResult | null {
  const positions = toPositions(event.frames, focalLengthPx, discDiameterM);
  if (positions.length < 2) return null;

  const first = positions[0];
  const last = positions[positions.length - 1];
  const durationMs = last.t - first.t;
  if (durationMs <= 0) return null;

  const dx = last.x - first.x;
  const dy = last.y - first.y;
  const dz = last.z - first.z;
  const distanceM = Math.sqrt(dx * dx + dy * dy + dz * dz);

  return {
    speedMps: distanceM / (durationMs / 1000),
    frameCount: positions.length,
    durationMs,
  };
}
