import { useCallback, useState } from "react";
import { useCamera } from "../camera/useCamera";
import { PROCESSING_HEIGHT, PROCESSING_WIDTH } from "../detection/constants";
import type { PassEvent } from "../detection/types";
import { useScanner } from "../detection/useScanner";
import { loadCalibration } from "../speed/calibration";
import { computeSpeed } from "../speed/computeSpeed";
import { loadDiscDiameterMm } from "../speed/settings";
import { mpsToKph, mpsToMph } from "../speed/units";

interface ScanResult {
  mph: number;
  kph: number;
  frameCount: number;
}

const PHASE_LABEL: Record<string, string> = {
  armed: "Watching for a throw…",
  capturing: "Tracking…",
  cooldown: "Got it — resetting…",
};

export function ScanScreen({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { videoRef, status, error } = useCamera();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const calibration = loadCalibration();

  const handleEvent = useCallback((event: PassEvent) => {
    const calibrationNow = loadCalibration();
    if (!calibrationNow) return;
    const discDiameterM = loadDiscDiameterMm() / 1000;
    const speed = computeSpeed(
      event,
      calibrationNow.focalLengthPx,
      discDiameterM,
    );
    if (!speed) return;
    setResult({
      mph: mpsToMph(speed.speedMps),
      kph: mpsToKph(speed.speedMps),
      frameCount: speed.frameCount,
    });
  }, []);

  const { phase, debug } = useScanner({
    videoRef,
    active: scanning,
    onEvent: handleEvent,
  });

  const toggleScan = () => {
    setResult(null);
    setScanning((s) => !s);
  };

  return (
    <main style={styles.main}>
      <div style={styles.header}>
        <h1 style={styles.h1}>Kinetic</h1>
        <button style={styles.iconButton} onClick={onOpenSettings}>
          Settings
        </button>
      </div>

      {status === "error" && <p style={styles.error}>{error}</p>}
      {status === "requesting" && (
        <p style={styles.help}>Requesting camera access…</p>
      )}

      {!calibration && (
        <p style={styles.warning}>
          Not calibrated yet — open Settings to calibrate before scanning.
        </p>
      )}

      <div style={styles.frame}>
        <video ref={videoRef} playsInline muted style={styles.video} />
      </div>

      <p style={styles.status}>
        {scanning
          ? PHASE_LABEL[phase]
          : "Ready — place the phone camera-up and press Start."}
      </p>

      {scanning && (
        <p style={styles.debug}>
          motion: {debug.frameSeen ? `${debug.pixelCount}px` : "…"}
        </p>
      )}

      <button
        style={{
          ...styles.primaryButton,
          background: scanning ? "#ff6b6b" : "#38e0c4",
        }}
        onClick={toggleScan}
        disabled={!calibration || status !== "ready"}
      >
        {scanning ? "Stop scan" : "Start scan"}
      </button>

      {result && (
        <div style={styles.resultCard}>
          <div style={styles.resultSpeed}>{result.mph.toFixed(1)} mph</div>
          <div style={styles.resultSub}>
            {result.kph.toFixed(1)} km/h · {result.frameCount} frames
          </div>
        </div>
      )}
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    fontFamily: "sans-serif",
    padding: "1.5rem",
    color: "#e8f0ee",
    maxWidth: 480,
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  h1: { margin: 0 },
  iconButton: {
    background: "none",
    border: "1px solid #2a4a44",
    color: "#9fb3ac",
    borderRadius: 999,
    padding: "0.4rem 0.9rem",
    fontSize: "0.85rem",
  },
  error: { color: "#ff6b6b" },
  warning: {
    color: "#f5c065",
    background: "rgba(245, 192, 101, 0.12)",
    borderRadius: 8,
    padding: "0.5rem 0.75rem",
    fontSize: "0.85rem",
  },
  help: { color: "#9fb3ac" },
  frame: {
    position: "relative",
    width: "100%",
    aspectRatio: `${PROCESSING_WIDTH} / ${PROCESSING_HEIGHT}`,
    background: "#000",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: "0.75rem",
  },
  video: { width: "100%", height: "100%", objectFit: "cover" },
  status: { textAlign: "center", color: "#9fb3ac", margin: "0.75rem 0" },
  debug: {
    textAlign: "center",
    color: "#5c7269",
    fontSize: "0.75rem",
    fontFamily: "monospace",
    margin: "-0.5rem 0 0.75rem",
  },
  primaryButton: {
    width: "100%",
    padding: "0.9rem",
    fontSize: "1.05rem",
    fontWeight: 600,
    borderRadius: 999,
    border: "none",
    color: "#0e1e2a",
  },
  resultCard: {
    marginTop: "1.25rem",
    padding: "1.25rem",
    borderRadius: 12,
    background: "#12261f",
    textAlign: "center",
  },
  resultSpeed: { fontSize: "2.5rem", fontWeight: 700, color: "#38e0c4" },
  resultSub: { color: "#9fb3ac", marginTop: "0.25rem" },
};
