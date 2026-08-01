import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { getPlayerLayouts, getPlayerStats, listPlayers } from "./api";
import type { HoleStat, Player, PlayedLayout } from "./api";
import { ClaimedStatusChip } from "./ClaimedStatusChip";
import { useIdentity } from "../identity/useIdentity";
import type { Status } from "../shared/status";

export function PlayerStatsPage() {
  const { playerId } = useParams();
  const id = Number(playerId);
  const { user } = useIdentity();

  const [player, setPlayer] = useState<Player | null>(null);
  const [layouts, setLayouts] = useState<PlayedLayout[]>([]);
  const [layoutId, setLayoutId] = useState<number | "">("");
  const [holes, setHoles] = useState<HoleStat[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const [{ players }, { layouts }] = await Promise.all([
          listPlayers(),
          getPlayerLayouts(id),
        ]);
        setPlayer(players.find((candidate) => candidate.id === id) ?? null);
        setLayouts(layouts);
        setLayoutId(layouts.length > 0 ? layouts[0].layoutId : "");
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player");
        setStatus("error");
      }
    })();
  }, [id]);

  const refreshStats = useCallback(async () => {
    if (layoutId === "") {
      setHoles([]);
      return;
    }
    try {
      const { holes } = await getPlayerStats(id, layoutId);
      setHoles(holes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stats");
      setStatus("error");
    }
  }, [id, layoutId]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={RouterLink} to="/players" sx={{ mb: 2 }}>
        ← Players
      </Button>

      {status === "loading" && <CircularProgress />}
      {status === "error" && <Alert severity="error">{error}</Alert>}

      {status === "ready" && (
        <>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Typography variant="h4" component="h1">
              {player?.name ?? "Player"}
            </Typography>
            {player && (
              <ClaimedStatusChip
                claimedByUserId={player.claimedByUserId}
                currentUserId={user?.id}
              />
            )}
          </Stack>

          {layouts.length === 0 ? (
            <Typography color="text.secondary">
              No completed rounds yet.
            </Typography>
          ) : (
            <>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="layout-filter-label">
                  Course &amp; layout
                </InputLabel>
                <Select
                  labelId="layout-filter-label"
                  label="Course & layout"
                  value={layoutId}
                  onChange={(event) =>
                    setLayoutId(event.target.value as number)
                  }
                  sx={{
                    "& .MuiSelect-select": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                >
                  {layouts.map((layout) => (
                    <MenuItem key={layout.layoutId} value={layout.layoutId}>
                      {layout.courseName} — {layout.layoutName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TableContainer component={Paper} variant="outlined">
                <Table
                  size="small"
                  sx={{
                    "& td, & th": { px: 0.75, py: 0.5, fontSize: "0.8125rem" },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>Hole</TableCell>
                      <TableCell align="right">Par</TableCell>
                      <TableCell align="right">Played</TableCell>
                      <TableCell align="right">Avg</TableCell>
                      <TableCell align="right">Best</TableCell>
                      <TableCell align="right">Worst</TableCell>
                      <TableCell align="right">Avg pen.</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {holes.map((hole) => (
                      <TableRow key={hole.holeId}>
                        <TableCell>{hole.number}</TableCell>
                        <TableCell align="right">{hole.par}</TableCell>
                        <TableCell align="right">{hole.timesPlayed}</TableCell>
                        <TableCell align="right">
                          {hole.avgStrokes.toFixed(1)}
                        </TableCell>
                        <TableCell align="right">{hole.bestStrokes}</TableCell>
                        <TableCell align="right">{hole.worstStrokes}</TableCell>
                        <TableCell align="right">
                          {hole.avgPenalties.toFixed(1)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </>
      )}
    </Container>
  );
}
