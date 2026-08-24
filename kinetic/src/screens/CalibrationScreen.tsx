import { useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useCamera } from "../camera/useCamera";
import { PROCESSING_HEIGHT, PROCESSING_WIDTH } from "../detection/constants";
import { saveCalibration } from "../speed/calibration";
import { loadDiscDiameterMm } from "../speed/settings";

interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function toCanvasPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: Math.min(Math.max((clientX - rect.left) * scaleX, 0), canvas.width),
    y: Math.min(Math.max((clientY - rect.top) * scaleY, 0), canvas.height),
  };
}

export function CalibrationScreen({ onDone }: { onDone: () => void }) {
  const { videoRef, status, error } = useCamera();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [distanceCm, setDistanceCm] = useState("100");
  const [captured, setCaptured] = useState(false);
  const [box, setBox] = useState<Box | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [saved, setSaved] = useState(false);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, PROCESSING_WIDTH, PROCESSING_HEIGHT);
    setCaptured(true);
    setBox(null);
    setSaved(false);
  };

  const retake = () => {
    setCaptured(false);
    setBox(null);
    setSaved(false);
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!captured || !canvasRef.current) return;
    const p = toCanvasPoint(canvasRef.current, e.clientX, e.clientY);
    setDragStart(p);
    setBox({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!dragStart || !canvasRef.current) return;
    const p = toCanvasPoint(canvasRef.current, e.clientX, e.clientY);
    setBox({ x1: dragStart.x, y1: dragStart.y, x2: p.x, y2: p.y });
  };

  const handlePointerUp = () => setDragStart(null);

  const boxWidthPx = box ? Math.abs(box.x2 - box.x1) : 0;
  const distanceM = Number(distanceCm) / 100;
  const discDiameterM = loadDiscDiameterMm() / 1000;
  const canSave = boxWidthPx >= 4 && distanceM > 0;
  const focalLengthPx = canSave
    ? (boxWidthPx * distanceM) / discDiameterM
    : null;

  const save = () => {
    if (!focalLengthPx) return;
    saveCalibration({ focalLengthPx });
    setSaved(true);
  };

  const boxStyle = box
    ? {
        left: `${(Math.min(box.x1, box.x2) / PROCESSING_WIDTH) * 100}%`,
        top: `${(Math.min(box.y1, box.y2) / PROCESSING_HEIGHT) * 100}%`,
        width: `${(Math.abs(box.x2 - box.x1) / PROCESSING_WIDTH) * 100}%`,
        height: `${(Math.abs(box.y2 - box.y1) / PROCESSING_HEIGHT) * 100}%`,
      }
    : null;

  return (
    <main style={styles.main}>
      <button style={styles.backButton} onClick={onDone}>
        ← Back
      </button>
      <h1 style={styles.h1}>Calibrate camera</h1>
      <p style={styles.help}>
        Hold the disc flat, facing the camera, at a distance you can measure
        (e.g. a tape measure or a fixed mark). Enter that distance, tap Capture,
        then drag a box across the disc's width in the photo.
      </p>

      {status === "error" && <p style={styles.error}>{error}</p>}

      <label style={styles.label}>
        Distance from camera to disc (cm)
        <input
          style={styles.input}
          type="number"
          inputMode="decimal"
          min={1}
          value={distanceCm}
          onChange={(e) => setDistanceCm(e.target.value)}
        />
      </label>

      <div style={styles.frame}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            ...styles.videoOrCanvas,
            display: captured ? "none" : "block",
          }}
        />
        <canvas
          ref={canvasRef}
          width={PROCESSING_WIDTH}
          height={PROCESSING_HEIGHT}
          style={{
            ...styles.videoOrCanvas,
            display: captured ? "block" : "none",
            touchAction: "none",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        {captured && boxStyle && <div style={{ ...styles.box, ...boxStyle }} />}
      </div>

      {!captured ? (
        <button
          style={styles.primaryButton}
          onClick={capture}
          disabled={status !== "ready"}
        >
          Capture
        </button>
      ) : (
        <>
          <p style={styles.help}>
            Drag a box across the disc's width.
            {boxWidthPx > 0 && ` Box width: ${boxWidthPx.toFixed(0)}px.`}
          </p>
          <div style={styles.row}>
            <button style={styles.secondaryButton} onClick={retake}>
              Retake
            </button>
            <button
              style={styles.primaryButton}
              onClick={save}
              disabled={!canSave}
            >
              Save calibration
            </button>
          </div>
        </>
      )}

      {saved && focalLengthPx && (
        <p style={styles.success}>
          Saved — focal length: {focalLengthPx.toFixed(1)}px. You can go back
          and start scanning.
        </p>
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
  backButton: {
    background: "none",
    border: "none",
    color: "#38e0c4",
    fontSize: "1rem",
    padding: 0,
    marginBottom: "0.5rem",
  },
  h1: { margin: "0 0 0.5rem" },
  help: { color: "#9fb3ac", fontSize: "0.9rem", lineHeight: 1.4 },
  error: { color: "#ff6b6b" },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    margin: "1rem 0",
    fontSize: "0.9rem",
  },
  input: {
    fontSize: "1.1rem",
    padding: "0.5rem",
    borderRadius: 8,
    border: "1px solid #2a4a44",
    background: "#0e1e2a",
    color: "#e8f0ee",
  },
  frame: {
    position: "relative",
    width: "100%",
    aspectRatio: `${PROCESSING_WIDTH} / ${PROCESSING_HEIGHT}`,
    background: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  videoOrCanvas: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  box: {
    position: "absolute",
    border: "2px solid #38e0c4",
    background: "rgba(56, 224, 196, 0.2)",
    pointerEvents: "none",
  },
  row: { display: "flex", gap: "0.75rem", marginTop: "0.75rem" },
  primaryButton: {
    marginTop: "1rem",
    padding: "0.75rem 1.25rem",
    fontSize: "1rem",
    fontWeight: 600,
    borderRadius: 999,
    border: "none",
    background: "#38e0c4",
    color: "#0e1e2a",
    flex: 1,
  },
  secondaryButton: {
    marginTop: "1rem",
    padding: "0.75rem 1.25rem",
    fontSize: "1rem",
    borderRadius: 999,
    border: "1px solid #38e0c4",
    background: "transparent",
    color: "#38e0c4",
    flex: 1,
  },
  success: { color: "#38e0c4", marginTop: "1rem" },
};
