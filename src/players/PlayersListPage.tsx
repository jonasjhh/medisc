import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { listPlayers, updatePlayer } from "./api";
import type { Player } from "./api";

type Status = "loading" | "ready" | "error";

export function PlayersListPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");

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

  const startEdit = (player: Player) => {
    setEditingId(player.id);
    setDraftName(player.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftName("");
  };

  const saveEdit = async (playerId: number) => {
    const name = draftName.trim();
    if (!name) {
      return;
    }
    try {
      const updated = await updatePlayer(playerId, name);
      setPlayers((prev) =>
        prev.map((player) => (player.id === playerId ? updated : player)),
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename player");
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Players
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {status === "loading" && <CircularProgress />}

      {status === "ready" && (
        <List component={Paper} variant="outlined" disablePadding>
          {players.map((player) => (
            <ListItem
              key={player.id}
              disablePadding
              secondaryAction={
                editingId === player.id ? (
                  <>
                    <IconButton
                      edge="end"
                      aria-label="save name"
                      onClick={() => void saveEdit(player.id)}
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      edge="end"
                      aria-label="cancel edit"
                      onClick={cancelEdit}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </>
                ) : (
                  <IconButton
                    edge="end"
                    aria-label={`edit ${player.name}`}
                    onClick={() => startEdit(player)}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                )
              }
            >
              {editingId === player.id ? (
                <Box sx={{ pl: 2, pr: 9, py: 1, width: "100%" }}>
                  <TextField
                    label="Name"
                    size="small"
                    fullWidth
                    autoFocus
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                  />
                </Box>
              ) : (
                <ListItemButton
                  component={RouterLink}
                  to={`/players/${player.id}`}
                >
                  <ListItemText primary={player.name} />
                </ListItemButton>
              )}
            </ListItem>
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
