import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import { unclaimPlayer } from "./api";
import { useIdentity } from "./IdentityContext";

export function UnclaimDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user, applyUser } = useIdentity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const { user: updated } = await unclaimPlayer();
      applyUser(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove link");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>This isn't me</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Remove the link between your account and{" "}
          {user?.claimedPlayer?.name ?? "this player"}? You can claim a
          different player afterward.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          disabled={busy}
          onClick={() => void handleConfirm()}
        >
          Remove link
        </Button>
      </DialogActions>
    </Dialog>
  );
}
