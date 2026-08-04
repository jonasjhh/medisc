import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
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
            onClick={() => void onFinish()}
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
    </>
  );
}
