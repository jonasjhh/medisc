import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { completeRound, getRound, updateHoleScore } from "./api";
import type { RoundDetail } from "./api";
import { ScoreAdjuster } from "./ScoreAdjuster";

type Status = "loading" | "ready" | "error";
type Field = "strokes" | "penalties";

export function RoundPage() {
  const { roundId } = useParams();
  const id = Number(roundId);

  const [round, setRound] = useState<RoundDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [holeIndex, setHoleIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const detail = await getRound(id);
      setRound(detail);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load round");
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const adjust = async (scoreId: number, field: Field, delta: number) => {
    if (!round) {
      return;
    }
    const current = round.scores.find((score) => score.id === scoreId);
    if (!current) {
      return;
    }
    const floor = field === "strokes" ? 1 : 0;
    const nextValue = Math.max(floor, current[field] + delta);
    if (nextValue === current[field]) {
      return;
    }

    setRound({
      ...round,
      scores: round.scores.map((score) =>
        score.id === scoreId ? { ...score, [field]: nextValue } : score,
      ),
    });

    try {
      await updateHoleScore(scoreId, { [field]: nextValue });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save score");
      await refresh();
    }
  };

  const handleFinish = async () => {
    setFinishing(true);
    setError(null);
    try {
      const updated = await completeRound(id);
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish round");
    } finally {
      setFinishing(false);
    }
  };

  if (status === "loading") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (status === "error" || !round) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const hole = round.holes[holeIndex];
  const isFirstHole = holeIndex === 0;
  const isLastHole = holeIndex === round.holes.length - 1;
  const isCompleted = round.completedAt !== null;

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={RouterLink} to="/rounds" sx={{ mb: 2 }}>
        ← Rounds
      </Button>

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        spacing={2}
      >
        <Typography variant="h5" component="h1" gutterBottom>
          {round.course.name} — {round.layout.name}
        </Typography>
        {isCompleted ? (
          <Chip label="Completed" color="success" size="small" />
        ) : (
          <Button
            variant="outlined"
            size="small"
            disabled={finishing}
            onClick={() => void handleFinish()}
          >
            Finish round
          </Button>
        )}
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ my: 2 }}
      >
        <IconButton
          aria-label="previous hole"
          onClick={() => setHoleIndex((index) => Math.max(0, index - 1))}
          disabled={isFirstHole}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box textAlign="center">
          <Typography variant="h4">Hole {hole.number}</Typography>
          <Typography color="text.secondary">
            Par {hole.par}
            {hole.distanceMeters ? ` · ${hole.distanceMeters} m` : ""}
          </Typography>
        </Box>
        <IconButton
          aria-label="next hole"
          onClick={() =>
            setHoleIndex((index) => Math.min(round.holes.length - 1, index + 1))
          }
          disabled={isLastHole}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      <Stack spacing={2}>
        {round.players.map((player) => {
          const score = round.scores.find(
            (candidate) =>
              candidate.holeId === hole.id && candidate.playerId === player.id,
          );
          if (!score) {
            return null;
          }
          return (
            <Paper key={player.id} variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                {player.name}
              </Typography>
              <Stack direction="row" spacing={4}>
                <ScoreAdjuster
                  label="Strokes"
                  value={score.strokes}
                  min={1}
                  readOnly={isCompleted}
                  onDecrement={() => void adjust(score.id, "strokes", -1)}
                  onIncrement={() => void adjust(score.id, "strokes", 1)}
                />
                <ScoreAdjuster
                  label="Penalties"
                  value={score.penalties}
                  min={0}
                  readOnly={isCompleted}
                  onDecrement={() => void adjust(score.id, "penalties", -1)}
                  onIncrement={() => void adjust(score.id, "penalties", 1)}
                />
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
}
