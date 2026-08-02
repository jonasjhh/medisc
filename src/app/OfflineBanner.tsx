import Alert from "@mui/material/Alert";
import { useOnlineStatus } from "./useOnlineStatus";
import { useQueuedHoleScoreCount } from "../rounds/useHoleScoreQueue";

// A fixed strip rather than a Snackbar: connectivity is ongoing status, not
// a one-off notification, so it shouldn't be dismissable or auto-hide.
export function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const queuedCount = useQueuedHoleScoreCount();

  if (isOnline) {
    return null;
  }

  return (
    <Alert
      severity="warning"
      variant="filled"
      role="status"
      sx={{ borderRadius: 0, justifyContent: "center" }}
    >
      You&apos;re offline — changes won&apos;t save until you&apos;re back in
      range.
      {queuedCount > 0 &&
        ` ${queuedCount} score${queuedCount === 1 ? "" : "s"} queued.`}
    </Alert>
  );
}
