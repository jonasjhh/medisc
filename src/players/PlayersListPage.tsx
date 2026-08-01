import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
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
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { AddPlayerForm } from "./AddPlayerForm";
import { deletePlayer, listPlayers, updatePlayer } from "./api";
import type { Player } from "./api";
import { ClaimedStatusChip } from "./ClaimedStatusChip";
import { useIdentity } from "../identity/useIdentity";
import { ConfirmDeleteDialog } from "../shared/ConfirmDeleteDialog";
import type { Status } from "../shared/status";

export function PlayersListPage() {
  const { user } = useIdentity();
  const [players, setPlayers] = useState<Player[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const canEdit = (player: Player) =>
    player.claimedByUserId === null || player.claimedByUserId === user?.id;

  const handlePlayerAdded = (player: Player) => {
    setPlayers((prev) =>
      [...prev, player].sort((a, b) => a.name.localeCompare(b.name)),
    );
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await deletePlayer(deleteTarget.id);
      setPlayers((prev) =>
        prev.filter((player) => player.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Players
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <AddPlayerForm onAdded={handlePlayerAdded} />
      </Paper>

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
                  <>
                    <Tooltip
                      title={
                        canEdit(player)
                          ? ""
                          : "Only the player who claimed this profile can edit it"
                      }
                    >
                      <span>
                        <IconButton
                          aria-label={`edit ${player.name}`}
                          disabled={!canEdit(player)}
                          onClick={() => startEdit(player)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip
                      title={
                        player.claimedByUserId !== null
                          ? "This player is claimed and can't be deleted — unclaim it from Settings first"
                          : player.roundCount > 0
                            ? "Can't delete a player with recorded rounds"
                            : ""
                      }
                    >
                      <span>
                        <IconButton
                          edge="end"
                          aria-label={`delete ${player.name}`}
                          disabled={
                            player.roundCount > 0 ||
                            player.claimedByUserId !== null
                          }
                          onClick={() => setDeleteTarget(player)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </>
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
                  sx={{ pr: 12 }}
                >
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <span>{player.name}</span>
                        <ClaimedStatusChip
                          claimedByUserId={player.claimedByUserId}
                          currentUserId={user?.id}
                        />
                      </Stack>
                    }
                  />
                </ListItemButton>
              )}
            </ListItem>
          ))}
          {players.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 2 }}>
              No players yet — add one above.
            </Typography>
          )}
        </List>
      )}

      <ConfirmDeleteDialog
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.name}?`}
        description="This removes them from the roster. This can't be undone."
        confirming={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void handleDelete()}
      />
    </Container>
  );
}
