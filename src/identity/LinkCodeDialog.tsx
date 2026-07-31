import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { createLinkCode } from "./api";

export function LinkCodeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setCode(null);
      setError(null);
      return;
    }
    createLinkCode()
      .then(({ code, expiresAt }) => {
        setCode(code);
        setSecondsLeft(
          Math.max(
            0,
            Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000),
          ),
        );
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Could not generate a code"),
      );
  }, [open]);

  useEffect(() => {
    if (!code || secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [code, secondsLeft]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Link another device</DialogTitle>
      <DialogContent>
        {error && <Typography color="error">{error}</Typography>}
        {code && (
          <>
            <DialogContentText>
              Enter this code on the new device within 15 minutes:
            </DialogContentText>
            <Typography
              variant="h4"
              align="center"
              sx={{ my: 2, letterSpacing: 4, fontFamily: "monospace" }}
            >
              {code}
            </Typography>
            <Typography
              align="center"
              color={secondsLeft === 0 ? "error" : "text.secondary"}
            >
              {secondsLeft > 0
                ? `Expires in ${minutes}:${seconds}`
                : "Expired — generate a new one"}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
