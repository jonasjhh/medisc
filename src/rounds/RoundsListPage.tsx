import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { listRounds } from "./api";
import type { RoundSummary } from "./api";

type Status = "loading" | "ready" | "error";

export function RoundsListPage() {
  const [rounds, setRounds] = useState<RoundSummary[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const { rounds } = await listRounds();
        setRounds(rounds);
        setStatus("ready");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rounds");
        setStatus("error");
      }
    })();
  }, []);

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
            </ListItemButton>
          ))}
          {rounds.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No rounds yet — start one above.
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}
