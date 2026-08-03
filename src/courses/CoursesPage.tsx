import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  getCourse,
  listCourses,
  type CourseDetail,
  type CourseSummary,
  type Layout,
} from "./api";
import { LayoutHoleTables } from "./LayoutHoleTables";
import type { Status } from "../shared/status";

function layoutTotals(layout: Layout) {
  const totalPar = layout.holes.reduce((sum, hole) => sum + hole.par, 0);
  const knownDistances = layout.holes.filter(
    (hole) => hole.distanceMeters !== null,
  );
  const totalMeters =
    knownDistances.length > 0
      ? knownDistances.reduce(
          (sum, hole) => sum + (hole.distanceMeters ?? 0),
          0,
        )
      : null;
  return { totalPar, totalMeters };
}

// Accordions stacked directly connect via MUI's default divider styling,
// which reads as one shared box rather than separate ones — the exact
// thing this restructure is fixing, so every level opts out of it.
const boxSx = {
  "&:before": { display: "none" },
  borderRadius: 1,
  "&.Mui-expanded": { margin: 0 },
} as const;

function LayoutAccordion({
  layout,
  expanded,
  onToggle,
}: {
  layout: Layout;
  expanded: boolean;
  onToggle: (event: SyntheticEvent, isExpanded: boolean) => void;
}) {
  const { totalPar, totalMeters } = layoutTotals(layout);

  return (
    <Accordion
      variant="outlined"
      disableGutters
      expanded={expanded}
      onChange={onToggle}
      sx={boxSx}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            {layout.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {layout.holes.length} hole{layout.holes.length === 1 ? "" : "s"} ·
            Par {totalPar}
            {totalMeters !== null ? ` · ${totalMeters}m` : ""}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <LayoutHoleTables layout={layout} />
      </AccordionDetails>
    </Accordion>
  );
}

function CourseAccordion({
  course,
  expanded,
  onToggle,
  detail,
  detailStatus,
  expandedLayoutIds,
  onToggleLayout,
}: {
  course: CourseSummary;
  expanded: boolean;
  onToggle: (event: SyntheticEvent, isExpanded: boolean) => void;
  detail: CourseDetail | undefined;
  detailStatus: Status | undefined;
  expandedLayoutIds: Set<number>;
  onToggleLayout: (
    layoutId: number,
  ) => (event: SyntheticEvent, isExpanded: boolean) => void;
}) {
  return (
    <Accordion
      variant="outlined"
      disableGutters
      expanded={expanded}
      onChange={onToggle}
      sx={boxSx}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {course.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {course.layoutCount} layout{course.layoutCount === 1 ? "" : "s"} ·{" "}
            {course.roundCount} round{course.roundCount === 1 ? "" : "s"}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {detailStatus === "loading" && <CircularProgress size={20} />}
        {detailStatus === "error" && (
          <Alert severity="error">Failed to load layouts</Alert>
        )}
        {detail && (
          <Stack spacing={1}>
            {detail.layouts.map((layout) => (
              <LayoutAccordion
                key={layout.id}
                layout={layout}
                expanded={expandedLayoutIds.has(layout.id)}
                onToggle={onToggleLayout(layout.id)}
              />
            ))}
            {detail.layouts.length === 0 && (
              <Typography color="text.secondary">No layouts yet.</Typography>
            )}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

export function CoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const [expandedCourseIds, setExpandedCourseIds] = useState<Set<number>>(
    new Set(),
  );
  const [courseDetails, setCourseDetails] = useState<
    Record<number, CourseDetail>
  >({});
  const [detailStatus, setDetailStatus] = useState<Record<number, Status>>({});
  const [expandedLayoutIds, setExpandedLayoutIds] = useState<Set<number>>(
    new Set(),
  );

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

  const handleToggleCourse =
    (courseId: number) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedCourseIds((prev) => {
        const next = new Set(prev);
        if (isExpanded) {
          next.add(courseId);
        } else {
          next.delete(courseId);
        }
        return next;
      });

      if (isExpanded && !courseDetails[courseId]) {
        setDetailStatus((prev) => ({ ...prev, [courseId]: "loading" }));
        getCourse(courseId)
          .then((detail) => {
            setCourseDetails((prev) => ({ ...prev, [courseId]: detail }));
            setDetailStatus((prev) => ({ ...prev, [courseId]: "ready" }));
          })
          .catch(() => {
            setDetailStatus((prev) => ({ ...prev, [courseId]: "error" }));
          });
      }
    };

  const handleToggleLayout =
    (layoutId: number) => (_event: SyntheticEvent, isExpanded: boolean) => {
      setExpandedLayoutIds((prev) => {
        const next = new Set(prev);
        if (isExpanded) {
          next.add(layoutId);
        } else {
          next.delete(layoutId);
        }
        return next;
      });
    };

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
        <Stack spacing={1.5}>
          {courses.map((course) => (
            <CourseAccordion
              key={course.id}
              course={course}
              expanded={expandedCourseIds.has(course.id)}
              onToggle={handleToggleCourse(course.id)}
              detail={courseDetails[course.id]}
              detailStatus={detailStatus[course.id]}
              expandedLayoutIds={expandedLayoutIds}
              onToggleLayout={handleToggleLayout}
            />
          ))}
          {courses.length === 0 && (
            <Typography color="text.secondary">No courses yet.</Typography>
          )}
        </Stack>
      )}
    </Container>
  );
}
