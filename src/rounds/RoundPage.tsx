import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { listPlayers } from "../players/api";
import type { Player } from "../players/api";
import { chunk } from "../shared/chunk";
import {
  completeRound,
  getRound,
  reopenRound,
  updateHoleScore,
  updateRound,
} from "./api";
import type { RoundDetail, RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScoreAdjuster } from "./ScoreAdjuster";
import { ScoreBadge } from "./ScoreBadge";
import { scoreOutcome } from "./scoreColor";

const HOLES_PER_GROUP = 9;

const outcomeButtonColor = {
  birdie: "success",
  par: "standard",
  bogey: "warning",
} as const;

function relativeToPar(total: number, par: number): string {
  const diff = total - par;
  if (diff === 0) {
    return "E";
  }
  return diff > 0 ? `+${diff}` : `${diff}`;
}

type Step =
  | { kind: "hole"; hole: RoundHole }
  | { kind: "checkpoint"; groupIndex: number }
  | { kind: "final" };

function TotalsList({
  players,
  scores,
  holesInScope,
}: {
  players: RoundPlayer[];
  scores: RoundScore[];
  holesInScope: RoundHole[];
}) {
  const holeIds = new Set(holesInScope.map((hole) => hole.id));
  const par = holesInScope.reduce((sum, hole) => sum + hole.par, 0);
  return (
    <Stack spacing={0.5}>
      {players.map((player) => {
        const total = scores
          .filter(
            (score) =>
              score.playerId === player.id && holeIds.has(score.holeId),
          )
          .reduce((sum, score) => sum + score.strokes, 0);
        return (
          <Typography key={player.id} fontWeight={600}>
            {player.name}: {total} ({relativeToPar(total, par)})
          </Typography>
        );
      })}
    </Stack>
  );
}

function ScorecardGroupTable({
  holes,
  players,
  scoreByKey,
}: {
  holes: RoundHole[];
  players: RoundPlayer[];
  scoreByKey: Map<string, RoundScore>;
}) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        aria-label={`Scorecard summary, holes ${holes[0].number}–${holes[holes.length - 1].number}`}
        sx={{
          "& td, & th": { px: 0.75, py: 0.5, fontSize: "0.8125rem" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Hole</TableCell>
            {holes.map((roundHole) => (
              <TableCell key={roundHole.id} align="center">
                {roundHole.number}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: "text.secondary" }}>Par</TableCell>
            {holes.map((roundHole) => (
              <TableCell
                key={roundHole.id}
                align="center"
                sx={{ color: "text.secondary" }}
              >
                {roundHole.par}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell component="th" scope="row">
                {player.name}
              </TableCell>
              {holes.map((roundHole) => {
                const score = scoreByKey.get(`${roundHole.id}:${player.id}`);
                return (
                  <TableCell key={roundHole.id} align="center">
                    {score && (
                      <ScoreBadge
                        strokes={score.strokes}
                        par={roundHole.par}
                        recorded={score.recorded}
                      />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

type Status = "loading" | "ready" | "error";
type Field = "strokes" | "penalties";

export function RoundPage() {
  const { roundId } = useParams();
  const id = Number(roundId);

  const [round, setRound] = useState<RoundDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [reopening, setReopening] = useState(false);
  const [togglingCounting, setTogglingCounting] = useState(false);

  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [editingPlayers, setEditingPlayers] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(
    new Set(),
  );
  const [savingPlayers, setSavingPlayers] = useState(false);

  const [swapMenu, setSwapMenu] = useState<{
    anchorEl: HTMLElement;
    player: RoundPlayer;
  } | null>(null);
  const [swapping, setSwapping] = useState(false);

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

  useEffect(() => {
    void (async () => {
      const { players } = await listPlayers();
      setAllPlayers(players);
    })();
  }, []);

  const setScore = async (scoreId: number, field: Field, nextValue: number) => {
    if (!round) {
      return;
    }
    const current = round.scores.find((score) => score.id === scoreId);
    if (!current || (current.recorded && current[field] === nextValue)) {
      return;
    }

    setRound({
      ...round,
      scores: round.scores.map((score) =>
        score.id === scoreId
          ? { ...score, [field]: nextValue, recorded: true }
          : score,
      ),
    });

    try {
      await updateHoleScore(scoreId, { [field]: nextValue });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save score");
      await refresh();
    }
  };

  const adjust = (scoreId: number, field: Field, delta: number) => {
    if (!round) {
      return;
    }
    const current = round.scores.find((score) => score.id === scoreId);
    if (!current) {
      return;
    }
    const floor = field === "strokes" ? 1 : 0;
    return setScore(scoreId, field, Math.max(floor, current[field] + delta));
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

  const handleReopen = async () => {
    setReopening(true);
    setError(null);
    try {
      const updated = await reopenRound(id);
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen round");
    } finally {
      setReopening(false);
    }
  };

  const handleToggleCounting = async () => {
    if (!round) {
      return;
    }
    setTogglingCounting(true);
    setError(null);
    try {
      const updated = await updateRound(id, { counting: !round.counting });
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update round");
    } finally {
      setTogglingCounting(false);
    }
  };

  const startEditingPlayers = () => {
    if (!round) {
      return;
    }
    setSelectedPlayerIds(new Set(round.players.map((player) => player.id)));
    setEditingPlayers(true);
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleSavePlayers = async () => {
    if (selectedPlayerIds.size === 0) {
      return;
    }
    setSavingPlayers(true);
    setError(null);
    try {
      const updated = await updateRound(id, {
        playerIds: [...selectedPlayerIds],
      });
      setRound(updated);
      setEditingPlayers(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update players");
    } finally {
      setSavingPlayers(false);
    }
  };

  const handleSwapPlayer = async (
    currentPlayerId: number,
    replacementPlayerId: number,
  ) => {
    if (!round) {
      return;
    }
    setSwapMenu(null);
    setSwapping(true);
    setError(null);
    try {
      const nextPlayerIds = round.players.map((player) =>
        player.id === currentPlayerId ? replacementPlayerId : player.id,
      );
      const updated = await updateRound(id, { playerIds: nextPlayerIds });
      setRound(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to swap player");
    } finally {
      setSwapping(false);
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

  const isCompleted = round.completedAt !== null;
  const coursePar = round.holes.reduce((sum, h) => sum + h.par, 0);
  const holeGroups = chunk(round.holes, HOLES_PER_GROUP);
  const scoreByKey = new Map(
    round.scores.map((score) => [`${score.holeId}:${score.playerId}`, score]),
  );

  const steps: Step[] = holeGroups.flatMap((holes, groupIndex) => [
    ...holes.map((h) => ({ kind: "hole" as const, hole: h })),
    groupIndex === holeGroups.length - 1
      ? { kind: "final" as const }
      : { kind: "checkpoint" as const, groupIndex },
  ]);
  const step = steps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === steps.length - 1;
  const hole = step.kind === "hole" ? step.hole : round.holes[0];
  const birdieValue = Math.max(1, hole.par - 1);
  const bogeyValue = hole.par + 1;

  const playersNotInRound = allPlayers.filter(
    (player) =>
      !round.players.some((roundPlayer) => roundPlayer.id === player.id),
  );

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
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
              disabled={reopening}
              onClick={() => void handleReopen()}
            >
              Reopen round
            </Button>
          </Stack>
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

      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Switch
            checked={round.counting}
            disabled={togglingCounting}
            onChange={() => void handleToggleCounting()}
          />
        }
        label="Counting round"
      />

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Players
          </Typography>
          {!isCompleted && !editingPlayers && (
            <Button size="small" onClick={startEditingPlayers}>
              Manage players
            </Button>
          )}
        </Stack>

        {editingPlayers ? (
          <>
            <FormGroup>
              {allPlayers.map((player) => (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      checked={selectedPlayerIds.has(player.id)}
                      onChange={() => togglePlayer(player.id)}
                    />
                  }
                  label={player.name}
                />
              ))}
            </FormGroup>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                disabled={savingPlayers || selectedPlayerIds.size === 0}
                onClick={() => void handleSavePlayers()}
              >
                Save players
              </Button>
              <Button size="small" onClick={() => setEditingPlayers(false)}>
                Cancel
              </Button>
            </Stack>
          </>
        ) : (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {round.players.map((player) => (
              <Stack
                key={player.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography color="text.secondary">{player.name}</Typography>
                {!isCompleted && (
                  <Tooltip
                    title={
                      playersNotInRound.length === 0
                        ? "No other players to swap in"
                        : `Swap ${player.name} for another player`
                    }
                  >
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`swap ${player.name}`}
                        disabled={playersNotInRound.length === 0 || swapping}
                        onClick={(event) =>
                          setSwapMenu({
                            anchorEl: event.currentTarget,
                            player,
                          })
                        }
                      >
                        <SwapHorizIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Menu
        anchorEl={swapMenu?.anchorEl ?? null}
        open={swapMenu !== null}
        onClose={() => setSwapMenu(null)}
      >
        {playersNotInRound.map((candidate) => (
          <MenuItem
            key={candidate.id}
            onClick={() =>
              swapMenu &&
              void handleSwapPlayer(swapMenu.player.id, candidate.id)
            }
          >
            {candidate.name}
          </MenuItem>
        ))}
      </Menu>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ my: 2 }}
      >
        <IconButton
          aria-label="previous hole"
          onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
          disabled={isFirstStep}
        >
          <ArrowBackIcon />
        </IconButton>
        {step.kind === "final" ? (
          <Box textAlign="center">
            <Typography variant="h4">Summary</Typography>
            <Typography color="text.secondary">
              Course par {coursePar}
            </Typography>
          </Box>
        ) : step.kind === "checkpoint" ? (
          (() => {
            const holesSoFar = holeGroups.slice(0, step.groupIndex + 1).flat();
            const parSoFar = holesSoFar.reduce((sum, h) => sum + h.par, 0);
            const lastHole = holesSoFar[holesSoFar.length - 1];
            return (
              <Box textAlign="center">
                <Typography variant="h4">Turn</Typography>
                <Typography color="text.secondary">
                  Par {parSoFar} through hole {lastHole.number}
                </Typography>
              </Box>
            );
          })()
        ) : (
          <Box textAlign="center">
            <Typography variant="h4">Hole {hole.number}</Typography>
            <Typography color="text.secondary">
              Par {hole.par}
              {hole.distanceMeters ? ` · ${hole.distanceMeters} m` : ""}
            </Typography>
          </Box>
        )}
        <IconButton
          aria-label="next hole"
          onClick={() =>
            setStepIndex((index) => Math.min(steps.length - 1, index + 1))
          }
          disabled={isLastStep}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Stack>

      {step.kind === "checkpoint" ? (
        <Stack spacing={2}>
          <TotalsList
            players={round.players}
            scores={round.scores}
            holesInScope={holeGroups.slice(0, step.groupIndex + 1).flat()}
          />
          {holeGroups.slice(0, step.groupIndex + 1).map((holes) => (
            <ScorecardGroupTable
              key={holes[0].id}
              holes={holes}
              players={round.players}
              scoreByKey={scoreByKey}
            />
          ))}
        </Stack>
      ) : step.kind === "final" ? (
        <Stack spacing={2}>
          <TotalsList
            players={round.players}
            scores={round.scores}
            holesInScope={round.holes}
          />
          {holeGroups.map((holes) => (
            <ScorecardGroupTable
              key={holes[0].id}
              holes={holes}
              players={round.players}
              scoreByKey={scoreByKey}
            />
          ))}
        </Stack>
      ) : (
        <Stack spacing={1.5}>
          {round.players.map((player) => {
            const score = round.scores.find(
              (candidate) =>
                candidate.holeId === hole.id &&
                candidate.playerId === player.id,
            );
            if (!score) {
              return null;
            }
            const outcome = scoreOutcome(score.strokes, hole.par);
            return (
              <Paper key={player.id} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {player.name}
                </Typography>

                {!isCompleted && (
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    fullWidth
                    value={score.recorded ? score.strokes : null}
                    onChange={(_event, value: number | null) => {
                      if (value !== null) {
                        void setScore(score.id, "strokes", value);
                      }
                    }}
                    aria-label={`${player.name} quick score`}
                    sx={{ mb: 1 }}
                  >
                    <ToggleButton
                      value={birdieValue}
                      color={outcomeButtonColor.birdie}
                    >
                      Birdie
                    </ToggleButton>
                    <ToggleButton
                      value={hole.par}
                      color={outcomeButtonColor.par}
                    >
                      Par
                    </ToggleButton>
                    <ToggleButton
                      value={bogeyValue}
                      color={outcomeButtonColor.bogey}
                    >
                      Bogey
                    </ToggleButton>
                  </ToggleButtonGroup>
                )}

                <Stack direction="row" spacing={4}>
                  <ScoreAdjuster
                    label="Strokes"
                    value={score.strokes}
                    min={1}
                    readOnly={isCompleted}
                    outcome={outcome}
                    recorded={score.recorded}
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

          <Stack direction="row" justifyContent="space-between" spacing={2}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setStepIndex((index) => Math.max(0, index - 1))}
              disabled={isFirstStep}
            >
              Previous
            </Button>
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() =>
                setStepIndex((index) => Math.min(steps.length - 1, index + 1))
              }
              disabled={isLastStep}
            >
              Next
            </Button>
          </Stack>
        </Stack>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Container>
  );
}
