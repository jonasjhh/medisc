import type { FrameSample, PassEvent } from "./types";

// Require more motion "mass" to start an event than to continue one — a
// disc filling more of the frame as it crosses overhead should trigger
// reliably, while small incidental motion (hand withdrawing, wind in
// grass) shouldn't arm a capture.
const TRIGGER_MIN_PIXELS = 90;
const MAX_MISSED_FRAMES = 2; // tolerate brief gaps mid-event
const MAX_EVENT_DURATION_MS = 700; // a disc crossing overhead is fast
const MIN_EVENT_FRAMES = 3; // need at least this many samples for a speed
const COOLDOWN_MS = 600; // avoid re-triggering on the same motion trailing off

export type ScanPhase = "armed" | "capturing" | "cooldown";

// State machine that turns a stream of per-frame motion samples into
// discrete "something flew over the camera" events.
export class EventCapture {
  private phaseValue: ScanPhase = "armed";
  private frames: FrameSample[] = [];
  private missedFrames = 0;
  private cooldownUntil = 0;

  get phase(): ScanPhase {
    return this.phaseValue;
  }

  /** Feed one frame's sample (or null). Returns a finished event once one completes. */
  update(sample: FrameSample | null, now: number): PassEvent | null {
    if (this.phaseValue === "cooldown") {
      if (now < this.cooldownUntil) return null;
      this.phaseValue = "armed";
    }

    if (this.phaseValue === "armed") {
      if (sample && sample.pixelCount >= TRIGGER_MIN_PIXELS) {
        this.phaseValue = "capturing";
        this.frames = [sample];
        this.missedFrames = 0;
      }
      return null;
    }

    // capturing
    if (sample) {
      this.frames.push(sample);
      this.missedFrames = 0;
    } else {
      this.missedFrames++;
    }

    const elapsed = now - this.frames[0].t;
    const shouldEnd =
      this.missedFrames > MAX_MISSED_FRAMES || elapsed > MAX_EVENT_DURATION_MS;
    if (!shouldEnd) return null;

    const finishedFrames = this.frames;
    this.frames = [];
    this.phaseValue = "cooldown";
    this.cooldownUntil = now + COOLDOWN_MS;

    return finishedFrames.length >= MIN_EVENT_FRAMES
      ? { frames: finishedFrames }
      : null;
  }

  reset() {
    this.phaseValue = "armed";
    this.frames = [];
    this.missedFrames = 0;
  }
}
