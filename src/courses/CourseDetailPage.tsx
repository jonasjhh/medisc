import { type FormEvent, useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createLayout, getCourse, type CourseDetail } from "./api";
import { LayoutCard } from "./LayoutCard";

type Status = "loading" | "ready" | "error";

export function CourseDetailPage() {
  const { courseId } = useParams();
  const id = Number(courseId);

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState("");
  const [addingLayout, setAddingLayout] = useState(false);

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

  const handleAddLayout = async (event: FormEvent) => {
    event.preventDefault();
    setAddingLayout(true);
    setError(null);
    try {
      await createLayout(id, layoutName);
      setLayoutName("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add layout");
    } finally {
      setAddingLayout(false);
    }
  };

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
              <LayoutCard
                key={layout.id}
                layout={layout}
                onHoleAdded={refresh}
              />
            ))}

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Add a layout
              </Typography>
              <Box
                component="form"
                onSubmit={handleAddLayout}
                sx={{ display: "flex", gap: 1 }}
              >
                <TextField
                  label="Layout name"
                  size="small"
                  fullWidth
                  value={layoutName}
                  onChange={(event) => setLayoutName(event.target.value)}
                  required
                />
                <Button
                  type="submit"
                  variant="contained"
                  disabled={addingLayout}
                >
                  Add
                </Button>
              </Box>
            </Paper>

            {error && <Alert severity="error">{error}</Alert>}
          </Stack>
        </>
      )}
    </Container>
  );
}
