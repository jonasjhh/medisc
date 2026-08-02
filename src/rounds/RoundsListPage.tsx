import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import NavigationIcon from "@mui/icons-material/Navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
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
import { deleteRound, listRounds } from "./api";
import type { RoundFilters, RoundSummary, RoundWeather } from "./api";
import { formatWeather, weatherIcon, windArrowRotation } from "./weather";
import { ConfirmDeleteDialog } from "../shared/ConfirmDeleteDialog";
import { formatDateTime } from "../shared/formatDateTime";
import type { Status } from "../shared/status";

function RoundWeatherBadge({ weather }: { weather: RoundWeather }) {
  const WeatherIcon = weatherIcon(weather.symbolCode);
  return (
    <Stack
      component="span"
      direction="row"
      spacing={0.5}
      alignItems="center"
      aria-label={formatWeather(weather)}
    >
      <WeatherIcon
        aria-hidden="true"
        sx={{ fontSize: 14, color: "text.secondary" }}
      />
      <Typography component="span" variant="caption" color="text.secondary">
        {Math.round(weather.temperatureCelsius)}°C
      </Typography>
      <NavigationIcon
        aria-hidden="true"
        sx={{
          fontSize: 14,
          color: "text.secondary",
          transform: `rotate(${windArrowRotation(weather.windDirectionDegrees)}deg)`,
        }}
      />
      <Typography component="span" variant="caption" color="text.secondary">
        {weather.windSpeedMs.toFixed(1)} m/s
      </Typography>
    </Stack>
  );
}

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

  const [deleteTarget, setDeleteTarget] = useState<RoundSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deleteRound(deleteTarget.id);
      setRounds((prev) => prev.filter((round) => round.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete round");
    } finally {
      setDeleting(false);
    }
  };

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

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {status === "loading" && <CircularProgress />}

      {status === "ready" && (
        <List component={Paper} variant="outlined" disablePadding>
          {rounds.map((round) => (
            <ListItem
              key={round.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label={`delete round: ${round.courseName} — ${round.layoutName}`}
                  onClick={() => setDeleteTarget(round)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemButton
                component={RouterLink}
                to={`/rounds/${round.id}`}
                sx={{ pr: 6 }}
              >
                <ListItemText
                  primary={`${round.courseName} — ${round.layoutName}`}
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                        display="block"
                      >
                        {round.players.length > 0
                          ? round.players
                              .map((player) => player.name)
                              .join(", ")
                          : "No players"}
                      </Typography>
                      <Stack
                        component="span"
                        direction="row"
                        spacing={0.75}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                        >
                          {formatDateTime(round.createdAt)}
                        </Typography>
                        {round.weather && (
                          <RoundWeatherBadge weather={round.weather} />
                        )}
                      </Stack>
                    </>
                  }
                />
                <Chip
                  label={round.completedAt ? "Completed" : "In progress"}
                  color={round.completedAt ? "success" : "default"}
                  size="small"
                />
              </ListItemButton>
            </ListItem>
          ))}
          {rounds.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No rounds match these filters.
            </Typography>
          )}
        </List>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title="Delete this round?"
        description={
          <>
            This permanently removes{" "}
            {deleteTarget && (
              <>
                {deleteTarget.courseName} — {deleteTarget.layoutName}
              </>
            )}{" "}
            and every score recorded for it. This can't be undone.
          </>
        }
        confirming={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </Container>
  );
}
