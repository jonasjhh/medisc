import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getCourse, type CourseDetail } from "./api";
import { LayoutCard } from "./LayoutCard";

type Status = "loading" | "ready" | "error";

export function CourseDetailPage() {
  const { courseId } = useParams();
  const id = Number(courseId);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const detail = await getCourse(id);
      setCourse(detail);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
      setStatus("error");
    }
  }, [id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Button component={RouterLink} to="/courses" sx={{ mb: 2 }}>
        ← Courses
      </Button>

      {status === "loading" && <CircularProgress />}

      {status === "error" && <Alert severity="error">{error}</Alert>}

      {status === "ready" && course && (
        <>
          <Typography variant="h4" component="h1" gutterBottom>
            {course.name}
          </Typography>

          <Stack spacing={2}>
            {course.layouts.map((layout) => (
              <LayoutCard key={layout.id} layout={layout} />
            ))}
            {course.layouts.length === 0 && (
              <Typography color="text.secondary">No layouts yet.</Typography>
            )}
          </Stack>
        </>
      )}
    </Container>
  );
}
