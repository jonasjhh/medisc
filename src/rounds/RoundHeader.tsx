import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import type { RoundDetail } from "./api";
import { EditRoundDetailsDialog } from "./EditRoundDetailsDialog";
import { RoundWeatherBadge } from "./RoundWeatherBadge";
import { ShareRoundDialog } from "./ShareRoundDialog";
import { formatDateTime } from "../shared/formatDateTime";

export function RoundHeader({
  round,
  isCompleted,
  finishing,
  reopening,
  onFinish,
  onReopen,
  onRoundUpdated,
}: {
  round: RoundDetail;
  isCompleted: boolean;
  finishing: boolean;
  reopening: boolean;
  onFinish: () => Promise<void>;
  onReopen: () => Promise<void>;
  onRoundUpdated: (round: RoundDetail) => void;
}) {
  const [shareOpen, setShareOpen] = useState(false);
  const [finishWarningOpen, setFinishWarningOpen] = useState(false);
  const [editDetailsOpen, setEditDetailsOpen] = useState(false);
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

      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {formatDateTime(round.createdAt)}
        </Typography>
        {round.weather && <RoundWeatherBadge weather={round.weather} />}
        <Tooltip
          title={
            isCompleted
              ? "Reopen the round to edit its date or weather"
              : "Edit date, time, or weather"
          }
        >
          <span>
            <IconButton
              size="small"
              aria-label="edit round details"
              disabled={isCompleted}
              onClick={() => setEditDetailsOpen(true)}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      <EditRoundDetailsDialog
        open={editDetailsOpen}
        onClose={() => setEditDetailsOpen(false)}
        round={round}
        onRoundUpdated={onRoundUpdated}
      />

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
