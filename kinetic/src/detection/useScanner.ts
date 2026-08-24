import { useEffect, useRef, useState } from "react";
import { EventCapture, type ScanPhase } from "./eventCapture";
import { FrameAnalyzer } from "./frameAnalyzer";
import type { PassEvent } from "./types";

export function useScanner({
  videoRef,
  active,
  onEvent,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  active: boolean;
  onEvent: (event: PassEvent) => void;
}) {
  const [phase, setPhase] = useState<ScanPhase>("armed");
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!active) return;

    const analyzer = new FrameAnalyzer();
    const capture = new EventCapture();
    let lastPhase: ScanPhase = "armed";
    let frameId: number;

    const tick = () => {
      const video = videoRef.current;
      if (video) {
        const now = performance.now();
        const sample = analyzer.sample(video, now);
        const event = capture.update(sample, now);
        if (capture.phase !== lastPhase) {
          lastPhase = capture.phase;
          setPhase(capture.phase);
        }
        if (event) onEventRef.current(event);
      }
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [active, videoRef]);

  return { phase };
}
