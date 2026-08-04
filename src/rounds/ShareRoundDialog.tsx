import { useEffect, useRef, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import CloseIcon from "@mui/icons-material/Close";
import type { RoundDetail } from "./api";
import {
  buildShareCardData,
  canvasToBlob,
  drawShareCard,
  getCardSize,
  listShareCards,
  shareCardKey,
  shareCardLabel,
  type ShareCardData,
  type ShareCardKind,
} from "./shareCard";

const THUMBNAIL_WIDTH = 320;

function ThumbnailCanvas({
  kind,
  label,
  data,
}: {
  kind: ShareCardKind;
  label: string;
  data: ShareCardData;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = getCardSize(kind, data);
  const thumbnailHeight = Math.round(
    (THUMBNAIL_WIDTH / size.width) * size.height,
  );

  useEffect(() => {
    if (canvasRef.current) {
      drawShareCard(canvasRef.current, kind, data, THUMBNAIL_WIDTH);
    }
  }, [kind, data]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`${label} preview`}
      width={THUMBNAIL_WIDTH}
      height={thumbnailHeight}
      style={{
        width: "100%",
        height: "auto",
        display: "block",
        borderRadius: 8,
      }}
    />
  );
}

// Feature-detected once per module: whether this browser can hand an image
// file to the OS share sheet at all (desktop Firefox, for example, cannot).
function canShareFiles(): boolean {
  if (typeof navigator === "undefined" || !navigator.share) {
    return false;
  }
  if (!navigator.canShare) {
    return false;
  }
  const probe = new File([""], "probe.png", { type: "image/png" });
  return navigator.canShare({ files: [probe] });
}

function isAbortError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "name" in err &&
    (err as { name: unknown }).name === "AbortError"
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ShareRoundDialog({
  open,
  onClose,
  round,
}: {
  open: boolean;
  onClose: () => void;
  round: RoundDetail;
}) {
  const [sharingKey, setSharingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const data = buildShareCardData(round);
  const cards = listShareCards(data);
  const fileSharingSupported = canShareFiles();

  const handleSelect = async (kind: ShareCardKind, label: string) => {
    setError(null);
    setSharingKey(shareCardKey(kind));
    try {
      const canvas = document.createElement("canvas");
      drawShareCard(canvas, kind, data);
      const blob = await canvasToBlob(canvas);
      if (!blob) {
        setError("Couldn't render the image. Please try again.");
        return;
      }
      const filename = `medisc-${round.course.name.toLowerCase().replace(/\s+/g, "-")}-${shareCardKey(kind)}.png`;
      if (fileSharingSupported) {
        const file = new File([blob], filename, { type: "image/png" });
        await navigator.share({
          files: [file],
          title: `${round.course.name} — ${label}`,
        });
        onClose();
      } else {
        downloadBlob(blob, filename);
        onClose();
      }
    } catch (err) {
      // AbortError fires when the user dismisses the native share sheet —
      // that's a normal cancel, not a failure worth surfacing. Checked via
      // .name rather than `instanceof Error`: DOMException (what browsers
      // actually reject with here) isn't reliably an Error subclass across
      // engines.
      if (isAbortError(err)) {
        return;
      }
      setError(
        err instanceof Error ? err.message : "Couldn't share the image.",
      );
    } finally {
      setSharingKey(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", pr: 6 }}>
        Share scorecard
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {fileSharingSupported
            ? "Pick a card to share."
            : "Pick a card to download."}
        </Typography>
        <Stack spacing={3}>
          {cards.map((kind) => {
            const label = shareCardLabel(kind, data);
            const key = shareCardKey(kind);
            const isSharing = sharingKey === key;
            return (
              <Stack key={key} spacing={1}>
                <Typography variant="subtitle2" fontWeight={600}>
                  {label}
                </Typography>
                <Stack
                  component="button"
                  type="button"
                  onClick={() => void handleSelect(kind, label)}
                  disabled={sharingKey !== null}
                  sx={{
                    position: "relative",
                    p: 0,
                    border: "none",
                    borderRadius: 1,
                    overflow: "hidden",
                    cursor: sharingKey ? "default" : "pointer",
                    bgcolor: "transparent",
                    outline: (t) => `1px solid ${t.palette.divider}`,
                    "&:hover": sharingKey
                      ? undefined
                      : {
                          outline: (t) => `2px solid ${t.palette.primary.main}`,
                        },
                  }}
                >
                  <ThumbnailCanvas kind={kind} label={label} data={data} />
                  {isSharing && (
                    <Stack
                      alignItems="center"
                      justifyContent="center"
                      sx={{
                        position: "absolute",
                        inset: 0,
                        bgcolor: "rgba(0,0,0,0.4)",
                      }}
                    >
                      <CircularProgress size={28} sx={{ color: "#fff" }} />
                    </Stack>
                  )}
                </Stack>
              </Stack>
            );
          })}
        </Stack>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
