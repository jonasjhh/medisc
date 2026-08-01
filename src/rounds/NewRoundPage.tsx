import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
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
import Typography from "@mui/material/Typography";
import { getCourse, listCourses } from "../courses/api";
import type { CourseDetail, CourseSummary } from "../courses/api";
import { AddPlayerForm } from "../players/AddPlayerForm";
import { getRecentCourses, listPlayers } from "../players/api";
import type { Player, PlayedLayout } from "../players/api";
import { createRound } from "./api";
import { useIdentity } from "../identity/useIdentity";
import type { Status } from "../shared/status";

export function NewRoundPage() {
  const navigate = useNavigate();
  const { user } = useIdentity();

  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(
    new Set(),
  );

  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "">("");
  const [courseDetail, setCourseDetail] = useState<CourseDetail | null>(null);
  const [selectedLayoutId, setSelectedLayoutId] = useState<number | "">("");
  const [recentCourses, setRecentCourses] = useState<PlayedLayout[]>([]);
  // Set right before changing selectedCourseId from a recent-course click, so
  // the course-detail effect below can select that specific layout instead
  // of defaulting to the course's first one.
  const pendingLayoutIdRef = useRef<number | null>(null);

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
        const pendingLayoutId = pendingLayoutIdRef.current;
        pendingLayoutIdRef.current = null;
        const pendingLayoutExists = detail.layouts.some(
          (layout) => layout.id === pendingLayoutId,
        );
        setSelectedLayoutId(
          pendingLayoutExists
            ? pendingLayoutId!
            : (detail.layouts[0]?.id ?? ""),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load course");
      }
    })();
  }, [selectedCourseId]);

  useEffect(() => {
    if (!user?.claimedPlayer) {
      return;
    }
    const claimedPlayerId = user.claimedPlayer.id;
    setSelectedPlayerIds((prev) =>
      prev.has(claimedPlayerId) ? prev : new Set(prev).add(claimedPlayerId),
    );
  }, [user]);

  useEffect(() => {
    if (!user?.claimedPlayer) {
      setRecentCourses([]);
      return;
    }
    void (async () => {
      const { recentCourses: fetched } = await getRecentCourses(
        user.claimedPlayer!.id,
      );
      setRecentCourses(fetched);
    })();
  }, [user]);

  const selectRecentCourse = (recent: PlayedLayout) => {
    pendingLayoutIdRef.current = recent.layoutId;
    setSelectedCourseId(recent.courseId);
  };

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

  const handlePlayerAdded = (player: Player) => {
    setPlayers((prev) =>
      [...prev, player].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setSelectedPlayerIds((prev) => new Set(prev).add(player.id));
  };

  const canStart =
    selectedPlayerIds.size > 0 &&
    selectedCourseId !== "" &&
    selectedLayoutId !== "";

  // Stable for as long as the selections stay the same, so retrying a
  // failed submit (e.g. after a network error, same click) reuses the same
  // key and the server returns the round it already created rather than a
  // duplicate. Changing the selection derives a new key, since that's a
  // genuinely different round to create.
  const selectedPlayerIdsKey = [...selectedPlayerIds]
    .sort((a, b) => a - b)
    .join(",");
  // These deps only invalidate the cached key when the selection changes;
  // the factory itself doesn't read them.
  const idempotencyKey = useMemo(
    () => crypto.randomUUID(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCourseId, selectedLayoutId, selectedPlayerIdsKey],
  );

  const handleStart = async () => {
    if (!canStart) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const round = await createRound(
        {
          courseId: selectedCourseId as number,
          layoutId: selectedLayoutId as number,
          playerIds: [...selectedPlayerIds],
        },
        idempotencyKey,
      );
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
          <Stack sx={{ mt: 1.5 }}>
            <AddPlayerForm onAdded={handlePlayerAdded} />
          </Stack>
        </Paper>

        {recentCourses.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Recent courses
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {recentCourses.map((recent) => (
                <Button
                  key={`${recent.courseId}-${recent.layoutId}`}
                  size="small"
                  variant="outlined"
                  onClick={() => selectRecentCourse(recent)}
                >
                  {recent.courseName} — {recent.layoutName}
                </Button>
              ))}
            </Stack>
          </Paper>
        )}

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
