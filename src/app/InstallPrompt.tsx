import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import { useInstallPromptContext } from "./useInstallPromptContext";

export function InstallPrompt() {
  const { canInstall, promptInstall, dismiss } = useInstallPromptContext();

  if (!canInstall) {
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
              onClick={dismiss}
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
