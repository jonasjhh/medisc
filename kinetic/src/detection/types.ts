// One frame's motion measurement, in processing-canvas pixel coordinates
// (see constants.ts).
export interface FrameSample {
  t: number; // performance.now() at capture, ms
  cx: number; // motion centroid x
  cy: number; // motion centroid y
  width: number; // bounding-box width of the moving region
  height: number; // bounding-box height of the moving region
  pixelCount: number; // how many pixels changed — a rough motion "mass"
}

export interface PassEvent {
  frames: FrameSample[];
}
