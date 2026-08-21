import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
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

function roundDiff(diff: number): number {
  return Math.round(diff * 10) / 10;
}

function formatDiff(roundedDiff: number): string {
  if (roundedDiff === 0) {
    return "even";
  }
  return roundedDiff > 0
    ? `+${roundedDiff.toFixed(1)}`
    : roundedDiff.toFixed(1);
}

export function HoleBreakdownPage() {
  const { playerId, holeId } = useParams();
  const id = Number(playerId);
  const currentHoleId = Number(holeId);
  const navigate = useNavigate();

  const [player, setPlayer] = useState<Player | null>(null);
  const [breakdown, setBreakdown] = useState<HoleBreakdown | null>(null);
  const [layoutHoles, setLayoutHoles] = useState<HoleStat[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { players } = await listPlayers();
        setPlayer(players.find((candidate) => candidate.id === id) ?? null);
      } catch {
        // Non-critical: the page still works without the player's name.
      }
    })();
  }, [id]);

  useEffect(() => {
    setStatus("loading");
    void (async () => {
      try {
        const { breakdown } = await getHoleBreakdown(id, currentHoleId);
        setBreakdown(breakdown);
        const { holes } = await getPlayerStats(id, breakdown.hole.layoutId);
        setLayoutHoles(holes);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load hole");
        setStatus("error");
      }
    })();
  }, [id, currentHoleId]);

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

  const diff =
    breakdown?.playerAvgStrokes != null &&
    breakdown.allPlayersAvgStrokes != null
      ? roundDiff(breakdown.playerAvgStrokes - breakdown.allPlayersAvgStrokes)
      : null;

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
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {player?.name ?? "Your"} average vs. the field
            </Typography>
            <Typography>
              Your average:{" "}
              <strong>{formatAvg(breakdown.playerAvgStrokes)}</strong>
              {" · "}
              Field average:{" "}
              <strong>{formatAvg(breakdown.allPlayersAvgStrokes)}</strong>
              {diff !== null && (
                <>
                  {" "}
                  (
                  <Box
                    component="span"
                    sx={{
                      color:
                        diff < 0
                          ? "success.main"
                          : diff > 0
                            ? "warning.main"
                            : "text.primary",
                      fontWeight: 600,
                    }}
                  >
                    {formatDiff(diff)}
                  </Box>
                  )
                </>
              )}
            </Typography>
          </Paper>

          {Object.values(breakdown.distribution).some((count) => count > 0) && (
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Throw distribution
              </Typography>
              <ScoreDistributionChart distribution={breakdown.distribution} />
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Recorded throws
            </Typography>
            {breakdown.throws.length === 0 ? (
              <Typography color="text.secondary">
                No counting throws recorded on this hole yet.
              </Typography>
            ) : (
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
            )}
          </Paper>
        </>
      )}
    </Container>
  );
}
