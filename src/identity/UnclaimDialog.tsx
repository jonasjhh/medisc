import { useState } from "react";
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

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const { user: updated } = await unclaimPlayer();
      applyUser(updated);
      onClose();
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
