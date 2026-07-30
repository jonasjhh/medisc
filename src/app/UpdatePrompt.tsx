import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import { useRegisterSW } from "virtual:pwa-register/react";

// Surfaces the two states vite-plugin-pwa's service worker cares about:
// content cached for offline use, and a newer version ready to activate.
export function UpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  if (needRefresh) {
    return (
      <Snackbar
        open
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="info"
          onClose={close}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => updateServiceWorker(true)}
            >
              Reload
            </Button>
          }
        >
          New version available.
        </Alert>
      </Snackbar>
    );
  }

  if (offlineReady) {
    return (
      <Snackbar
        open
        autoHideDuration={4000}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={close}>
          App ready to work offline.
        </Alert>
      </Snackbar>
    );
  }

  return null;
}
