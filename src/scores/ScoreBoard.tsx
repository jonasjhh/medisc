import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useVisitTracking } from "./useVisitTracking";

export function ScoreBoard() {
  const { status, error, stats, topScores } = useVisitTracking();

  if (status === "loading") {
    return <CircularProgress size={24} aria-label="Loading visit stats" />;
  }

  if (status === "error") {
    return (
      <Alert severity="warning" sx={{ maxWidth: 360 }}>
        Couldn't reach the API: {error}
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 3, width: "100%", maxWidth: 360 }}>
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-around">
          <Box textAlign="center">
            <Typography variant="h4">{stats?.yourVisits}</Typography>
            <Typography variant="caption" color="text.secondary">
              Your visits
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="h4">{stats?.totalVisits}</Typography>
            <Typography variant="caption" color="text.secondary">
              Total visits
            </Typography>
          </Box>
        </Stack>
        <Divider />
        <Typography variant="subtitle2">Top visitors</Typography>
        <List dense>
          {topScores.map((entry, index) => (
            <ListItem key={entry.userId} disableGutters>
              <ListItemText
                primary={`#${index + 1} ${entry.userId.slice(0, 8)}`}
                secondary={`${entry.visits} visit${entry.visits === 1 ? "" : "s"}`}
              />
            </ListItem>
          ))}
        </List>
      </Stack>
    </Paper>
  );
}
