import { type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { getCourse, listCourses } from "../courses/api";
import type { CourseDetail, CourseSummary } from "../courses/api";
import { createPlayer, listPlayers } from "../players/api";
import type { Player } from "../players/api";
import { createRound } from "./api";

type Status = "loading" | "ready" | "error";

export function NewRoundPage() {
  const navigate = useNavigate();

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(
    new Set(),
  );
  const [newPlayerName, setNewPlayerName] = useState("");

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | "">("");

  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [playersRes, coursesRes] = await Promise.all([
          listPlayers(),
          listCourses(),
        ]);
        setPlayers(playersRes.players);
        setCourses(coursesRes.courses);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
        setStatus("error");
      }
    })();
  }, []);

  useEffect(() => {
    if (selectedCourseId === "") {
      setCourseDetail(null);
      setSelectedLayoutId("");
      return;
    }
    void (async () => {
      try {
        const detail = await getCourse(selectedCourseId);
        setCourseDetail(detail);
        setSelectedLayoutId(detail.layouts[0]?.id ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      }
    })();
  }, [selectedCourseId]);

  const togglePlayer = (id: number) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAddPlayer = async (event: FormEvent) => {
    event.preventDefault();
    const name = newPlayerName.trim();
    if (!name) {
      return;
    }
    try {
      const player = await createPlayer(name);
      setPlayers((prev) =>
        [...prev, player].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setSelectedPlayerIds((prev) => new Set(prev).add(player.id));
      setNewPlayerName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    }
  };

  const canStart =
    selectedPlayerIds.size > 0 &&
    selectedCourseId !== "" &&
    selectedLayoutId !== "";

  const handleStart = async () => {
    if (!canStart) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const round = await createRound({
        courseId: selectedCourseId as number,
        layoutId: selectedLayoutId as number,
        playerIds: [...selectedPlayerIds],
      });
      navigate(`/rounds/${round.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start round");
      setSubmitting(false);
    }
  };

  if (status === "loading") {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Start a round
      </Typography>

      <Stack spacing={3}>
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Players
          </Typography>
          <FormGroup>
            {players.map((player) => (
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
          {players.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No players yet — add one below.
            </Typography>
          )}
          <Box
            component="form"
            onSubmit={handleAddPlayer}
            sx={{ display: "flex", gap: 1, mt: 1.5 }}
          >
            <TextField
              label="Add player"
              size="small"
              fullWidth
              value={newPlayerName}
              onChange={(event) => setNewPlayerName(event.target.value)}
            />
            <Button type="submit" variant="outlined">
              Add
            </Button>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Course
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="course-label">Course</InputLabel>
              <Select
                labelId="course-label"
                label="Course"
                value={selectedCourseId}
                onChange={(event) =>
                  setSelectedCourseId(event.target.value as number)
                }
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {courseDetail && (
              <FormControl fullWidth size="small">
                <InputLabel id="layout-label">Layout</InputLabel>
                <Select
                  labelId="layout-label"
                  label="Layout"
                  value={selectedLayoutId}
                  onChange={(event) =>
                    setSelectedLayoutId(event.target.value as number)
                  }
                >
                  {courseDetail.layouts.map((layout) => (
                    <MenuItem key={layout.id} value={layout.id}>
                      {layout.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </Paper>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="contained"
          size="large"
          disabled={!canStart || submitting}
          onClick={handleStart}
        >
          Start round
        </Button>
      </Stack>
    </Container>
  );
}
