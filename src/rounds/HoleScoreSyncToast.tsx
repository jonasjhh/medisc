import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

export function HoleScoreSyncToast() {
  const [syncedCount, setSyncedCount] = useState<number | null>(null);

  useEffect(() => {
    const handleSynced = (event: Event) => {
      const { count } = (event as CustomEvent<{ count: number }>).detail;
      setSyncedCount(count);
    };
    window.addEventListener("medisc:hole-score-queue-synced", handleSynced);
    return () =>
      window.removeEventListener(
        "medisc:hole-score-queue-synced",
        handleSynced,
      );
  }, []);

  if (syncedCount === null) {
    return null;
  }

  return (
    <Snackbar
      open
      autoHideDuration={4000}
      onClose={() => setSyncedCount(null)}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
    >
      <Alert severity="success" onClose={() => setSyncedCount(null)}>
        Synced {syncedCount} score{syncedCount === 1 ? "" : "s"} saved while
        offline.
      </Alert>
    </Snackbar>
  );
}
