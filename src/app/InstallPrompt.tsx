import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import { useInstallPrompt } from "./useInstallPrompt";

export function InstallPrompt() {
  const { canInstall, promptInstall } = useInstallPrompt();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || dismissed) {
    return null;
  }

  return (
    <Snackbar open anchorOrigin={{ vertical: "top", horizontal: "center" }}>
      <Alert
        severity="info"
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={() => void promptInstall()}
            >
              Install
            </Button>
            <IconButton
              size="small"
              color="inherit"
              aria-label="close"
              onClick={() => setDismissed(true)}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        }
      >
        Install Medisc for quick access and offline use.
      </Alert>
    </Snackbar>
  );
}
