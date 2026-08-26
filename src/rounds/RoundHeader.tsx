import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { RoundDetail } from "./api";
import { ShareRoundDialog } from "./ShareRoundDialog";

export function RoundHeader({
  round,
  isCompleted,
  finishing,
  reopening,
  onFinish,
  onReopen,
}: {
  round: RoundDetail;
  isCompleted: boolean;
  finishing: boolean;
  reopening: boolean;
  onFinish: () => Promise<void>;
  onReopen: () => Promise<void>;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [finishWarningOpen, setFinishWarningOpen] = useState(false);
  const unrecordedCount = round.scores.filter(
    (score) => !score.recorded,
  ).length;

  const handleFinishClick = () => {
    if (unrecordedCount > 0) {
      setFinishWarningOpen(true);
    } else {
      void onFinish();
    }
  };

  const handleConfirmFinish = () => {
    setFinishWarningOpen(false);
    void onFinish();
  };

  return (
    <>
      <Button component={RouterLink} to="/rounds" sx={{ mb: 2 }}>
        ← Rounds
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        flexWrap="wrap"
        rowGap={1}
        spacing={2}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {round.course.name} — {round.layout.name}
        </Typography>
        {isCompleted ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip label="Completed" color="success" size="small" />
            <Button
              size="small"
              variant="outlined"
              onClick={() => setShareOpen(true)}
            >
              Share
            </Button>
            <Button
              size="small"
              variant="outlined"
              disabled={reopening}
              onClick={() => void onReopen()}
            >
              Reopen round
            </Button>
          </Stack>
        ) : (
          <Button
            variant="outlined"
            size="small"
            disabled={finishing}
            onClick={handleFinishClick}
          >
            Finish round
          </Button>
        )}
      </Stack>

      {isCompleted && (
        <ShareRoundDialog
          open={shareOpen}
          onClose={() => setShareOpen(false)}
          round={round}
        />
      )}

      <Dialog
        open={finishWarningOpen}
        onClose={() => setFinishWarningOpen(false)}
      >
        <DialogTitle>Finish round?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {unrecordedCount} hole{unrecordedCount === 1 ? "" : "s"} haven't
            been scored yet — they'll stay unregistered after you finish.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishWarningOpen(false)}>Cancel</Button>
          <Button disabled={finishing} onClick={handleConfirmFinish}>
            Finish anyway
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
