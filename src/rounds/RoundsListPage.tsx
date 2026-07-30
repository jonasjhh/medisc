import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { listCourses } from "../courses/api";
import type { CourseSummary } from "../courses/api";
import { listPlayers } from "../players/api";
import type { Player } from "../players/api";
import { listRounds } from "./api";
import type { RoundFilters, RoundSummary } from "./api";

type Status = "loading" | "ready" | "error";

export function RoundsListPage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<RoundFilters["status"] | "">(
    "",
  );
  const [playerFilter, setPlayerFilter] = useState<number | "">("");
  const [courseFilter, setCourseFilter] = useState<number | "">("");

  const refresh = useCallback(async () => {
    try {
      const { rounds } = await listRounds({
        status: statusFilter || undefined,
        playerId: playerFilter || undefined,
        courseId: courseFilter || undefined,
      });
      setRounds(rounds);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rounds");
      setStatus("error");
    }
  }, [statusFilter, playerFilter, courseFilter]);

  useEffect(() => {
    void (async () => {
      const [playersRes, coursesRes] = await Promise.all([
        listPlayers(),
        listCourses(),
      ]);
      setPlayers(playersRes.players);
      setCourses(coursesRes.courses);
    })();
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h4" component="h1">
          Rounds
        </Typography>
        <Button variant="contained" component={RouterLink} to="/rounds/new">
          New round
        </Button>
      </Stack>

      <Stack
        direction="row"
        flexWrap="wrap"
        useFlexGap
        columnGap={1}
        rowGap={1}
        sx={{ mb: 2 }}
      >
        <FormControl size="small" sx={{ minWidth: 110, flex: "1 1 110px" }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as RoundFilters["status"] | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="in_progress">In progress</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 110, flex: "1 1 110px" }}>
          <InputLabel id="player-filter-label">Player</InputLabel>
          <Select
            labelId="player-filter-label"
            label="Player"
            value={playerFilter}
            onChange={(event) =>
              setPlayerFilter(event.target.value as number | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            {players.map((player) => (
              <MenuItem key={player.id} value={player.id}>
                {player.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 110, flex: "1 1 110px" }}>
          <InputLabel id="course-filter-label">Course</InputLabel>
          <Select
            labelId="course-filter-label"
            label="Course"
            value={courseFilter}
            onChange={(event) =>
              setCourseFilter(event.target.value as number | "")
            }
          >
            <MenuItem value="">All</MenuItem>
            {courses.map((course) => (
              <MenuItem key={course.id} value={course.id}>
                {course.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      {status === "loading" && <CircularProgress />}
      {status === "error" && <Alert severity="error">{error}</Alert>}

      {status === "ready" && (
        <List component={Paper} variant="outlined" disablePadding>
          {rounds.map((round) => (
            <ListItemButton
              key={round.id}
              component={RouterLink}
              to={`/rounds/${round.id}`}
            >
              <ListItemText
                primary={`${round.courseName} — ${round.layoutName}`}
                secondary={`${round.playerCount} player${round.playerCount === 1 ? "" : "s"}`}
              />
              <Chip
                label={round.completedAt ? "Completed" : "In progress"}
                color={round.completedAt ? "success" : "default"}
                size="small"
              />
            </ListItemButton>
          ))}
          {rounds.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No rounds match these filters.
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}
