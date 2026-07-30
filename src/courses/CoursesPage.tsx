import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { listCourses, type CourseSummary } from "./api";

type Status = "loading" | "ready" | "error";

export function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Courses
      </Typography>

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
              No courses yet.
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}
