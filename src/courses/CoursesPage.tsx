import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createCourse, listCourses, type CourseSummary } from "./api";

type Status = "loading" | "ready" | "error";

export function CoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { courses } = await listCourses();
      setCourses(courses);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const course = await createCourse(name);
      setName("");
      navigate(`/courses/${course.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add course");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Courses
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", gap: 1 }}
        >
          <TextField
            label="Course name"
            size="small"
            fullWidth
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <Button type="submit" variant="contained" disabled={submitting}>
            Add course
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {status === "loading" && <CircularProgress />}

      {status !== "loading" && (
        <List component={Paper} variant="outlined" disablePadding>
          {courses.map((course) => (
            <ListItemButton
              key={course.id}
              component={RouterLink}
              to={`/courses/${course.id}`}
            >
              <ListItemText
                primary={course.name}
                secondary={`${course.layoutCount} layout${course.layoutCount === 1 ? "" : "s"}`}
              />
            </ListItemButton>
          ))}
          {courses.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No courses yet — add one above.
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}
