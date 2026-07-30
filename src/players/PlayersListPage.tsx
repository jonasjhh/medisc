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
import { listPlayers } from "./api";
import type { Player } from "./api";

type Status = "loading" | "ready" | "error";

export function PlayersListPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const { players } = await listPlayers();
      setPlayers(players);
      setStatus("ready");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Players
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      {status === "loading" && <CircularProgress />}

      {status === "ready" && (
        <List component={Paper} variant="outlined" disablePadding>
          {players.map((player) => (
            <ListItemButton
              key={player.id}
              component={RouterLink}
              to={`/players/${player.id}`}
            >
              <ListItemText primary={player.name} />
            </ListItemButton>
          ))}
          {players.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No players yet — add one when starting a round.
            </Typography>
          )}
        </List>
      )}
    </Container>
  );
}
