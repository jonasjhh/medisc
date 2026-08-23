import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TuneIcon from "@mui/icons-material/Tune";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getHoleBreakdown, getPlayerStats, listPlayers } from "./api";
import type { HoleBreakdown, HoleStat, Player } from "./api";
import { ScoreDistributionChart } from "./ScoreDistributionChart";
import { ScoreBadge } from "../rounds/ScoreBadge";
import { formatDateTime } from "../shared/formatDateTime";
import type { Status } from "../shared/status";

function formatAvg(value: number | null): string {
  return value === null ? "—" : value.toFixed(1);
}

export function HoleBreakdownPage() {
  const { playerId, holeId } = useParams();
  const id = Number(playerId);
  const currentHoleId = Number(holeId);
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [breakdown, setBreakdown] = useState<HoleBreakdown | null>(null);
  const [layoutHoles, setLayoutHoles] = useState<HoleStat[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  // null means "no explicit selection" — the field defaults to everyone.
  const [fieldPlayerIds, setFieldPlayerIds] = useState<number[] | null>(null);
  const [fieldDialogOpen, setFieldDialogOpen] = useState(false);
  const [pendingFieldSelection, setPendingFieldSelection] = useState<
    Set<number>
  >(new Set());

  useEffect(() => {
    void (async () => {
      try {
        const { players } = await listPlayers();
        setPlayers(players);
        setPlayer(players.find((candidate) => candidate.id === id) ?? null);
      } catch {
        // Non-critical: the page still works without player names.
      }
    })();
  }, [id]);

  useEffect(() => {
    setStatus("loading");
    void (async () => {
      try {
        const { breakdown } = await getHoleBreakdown(
          id,
          currentHoleId,
          fieldPlayerIds ?? undefined,
        );
        setBreakdown(breakdown);
        const { holes } = await getPlayerStats(id, breakdown.hole.layoutId);
        setLayoutHoles(holes);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hole");
        setStatus("error");
      }
    })();
  }, [id, currentHoleId, fieldPlayerIds]);

  const holeIndex = layoutHoles.findIndex(
    (hole) => hole.holeId === currentHoleId,
  );
  const previousHole = holeIndex > 0 ? layoutHoles[holeIndex - 1] : null;
  const nextHole =
    holeIndex >= 0 && holeIndex < layoutHoles.length - 1
      ? layoutHoles[holeIndex + 1]
      : null;

  const goToHole = (targetHoleId: number) => {
    navigate(`/players/${id}/holes/${targetHoleId}`);
  };

  const openFieldDialog = () => {
    setPendingFieldSelection(
      new Set(fieldPlayerIds ?? players.map((p) => p.id)),
    );
    setFieldDialogOpen(true);
  };

  const toggleFieldPlayer = (playerIdToToggle: number) => {
    setPendingFieldSelection((current) => {
      const next = new Set(current);
      if (next.has(playerIdToToggle)) {
        next.delete(playerIdToToggle);
      } else {
        next.add(playerIdToToggle);
      }
      return next;
    });
  };

  const applyFieldSelection = () => {
    setFieldPlayerIds([...pendingFieldSelection]);
    setFieldDialogOpen(false);
  };

  const resetFieldSelection = () => {
    setFieldPlayerIds(null);
    setFieldDialogOpen(false);
  };

  const fieldCount = (fieldPlayerIds ?? players.map((p) => p.id)).length;
  const fieldHasCustomSelection = fieldPlayerIds !== null;

  const playerThrowCount = breakdown
    ? Object.values(breakdown.playerDistribution).reduce((a, b) => a + b, 0)
    : 0;
  const fieldThrowCount = breakdown
    ? Object.values(breakdown.fieldDistribution).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={RouterLink} to={`/players/${id}`} sx={{ mb: 2 }}>
        ← {player?.name ?? "Player"} stats
      </Button>

      {status === "loading" && <CircularProgress />}
      {status === "error" && <Alert severity="error">{error}</Alert>}

      {status === "ready" && breakdown && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <IconButton
              aria-label="previous hole"
              disabled={!previousHole}
              onClick={() => previousHole && goToHole(previousHole.holeId)}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box textAlign="center">
              <Typography color="text.secondary" variant="body2">
                {breakdown.hole.courseName} — {breakdown.hole.layoutName}
              </Typography>
              <Typography variant="h4">Hole {breakdown.hole.number}</Typography>
              <Typography color="text.secondary">
                Par {breakdown.hole.par}
                {breakdown.hole.distanceMeters
                  ? ` · ${breakdown.hole.distanceMeters} m`
                  : ""}
              </Typography>
            </Box>
            <IconButton
              aria-label="next hole"
              disabled={!nextHole}
              onClick={() => nextHole && goToHole(nextHole.holeId)}
            >
              <ArrowForwardIcon />
            </IconButton>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                The field
                {fieldHasCustomSelection ? ` (${fieldCount} selected)` : ""}
              </Typography>
              <IconButton
                aria-label="configure the field"
                size="small"
                onClick={openFieldDialog}
              >
                <TuneIcon fontSize="small" />
              </IconButton>
            </Stack>
            {fieldThrowCount > 0 ? (
              <>
                <ScoreDistributionChart
                  distribution={breakdown.fieldDistribution}
                />
                <Typography sx={{ mt: 1 }}>
                  Field average:{" "}
                  <strong>{formatAvg(breakdown.fieldAvgStrokes)}</strong>
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                No counting throws recorded for the field yet.
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {player?.name ?? "Your"} throws
            </Typography>
            {playerThrowCount > 0 ? (
              <>
                <ScoreDistributionChart
                  distribution={breakdown.playerDistribution}
                />
                <Typography sx={{ mt: 1 }}>
                  Your average:{" "}
                  <strong>{formatAvg(breakdown.playerAvgStrokes)}</strong>
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                No counting throws recorded on this hole yet.
              </Typography>
            )}
          </Paper>

          {breakdown.throws.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Recorded throws
              </Typography>
              <Stack spacing={1}>
                {breakdown.throws.map((holeThrow, index) => (
                  <Stack
                    key={`${holeThrow.roundId}-${index}`}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography color="text.secondary" variant="body2">
                      {formatDateTime(holeThrow.date)}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {holeThrow.penalties > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          +{holeThrow.penalties} pen.
                        </Typography>
                      )}
                      <ScoreBadge
                        strokes={holeThrow.strokes}
                        par={breakdown.hole.par}
                        recorded
                      />
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Paper>
          )}
        </>
      )}

      <Dialog
        open={fieldDialogOpen}
        onClose={() => setFieldDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Configure the field</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
            Choose which players count toward the field's distribution and
            average.
          </Typography>
          <FormGroup>
            {players.map((candidate) => (
              <FormControlLabel
                key={candidate.id}
                control={
                  <Checkbox
                    checked={pendingFieldSelection.has(candidate.id)}
                    onChange={() => toggleFieldPlayer(candidate.id)}
                  />
                }
                label={candidate.name}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFieldSelection}>Reset to everyone</Button>
          <Button onClick={() => setFieldDialogOpen(false)}>Cancel</Button>
          <Button onClick={applyFieldSelection} variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
