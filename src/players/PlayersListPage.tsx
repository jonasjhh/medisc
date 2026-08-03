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

function byName(a: Player, b: Player) {
  return a.name.localeCompare(b.name);
}

function PlayerRow({
  player,
  editing,
  draftName,
  onDraftNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDeleteRequest,
  canEdit,
  currentUserId,
}: {
  player: Player;
  editing: boolean;
  draftName: string;
  onDraftNameChange: (value: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteRequest: () => void;
  canEdit: boolean;
  currentUserId: number | undefined;
}) {
  return (
    <ListItem
      disablePadding
      secondaryAction={
        editing ? (
          <>
            <IconButton edge="end" aria-label="save name" onClick={onSaveEdit}>
              <CheckIcon fontSize="small" />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="cancel edit"
              onClick={onCancelEdit}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </>
        ) : (
          <>
            <Tooltip
              title={
                canEdit
                  ? ""
                  : "Only the player who claimed this profile can edit it"
              }
            >
              <span>
                <IconButton
                  aria-label={`edit ${player.name}`}
                  disabled={!canEdit}
                  onClick={onStartEdit}
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
                    player.roundCount > 0 || player.claimedByUserId !== null
                  }
                  onClick={onDeleteRequest}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )
      }
    >
      {editing ? (
        <Box sx={{ pl: 2, pr: 9, py: 1, width: "100%" }}>
          <TextField
            label="Name"
            size="small"
            fullWidth
            autoFocus
            value={draftName}
            onChange={(event) => onDraftNameChange(event.target.value)}
          />
        </Box>
      ) : (
        <ListItemButton
          component={RouterLink}
          to={`/players/${player.id}`}
          sx={{ pr: 12 }}
        >
          <ListItemText
            sx={{ minWidth: 0 }}
            primary={
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                sx={{ minWidth: 0 }}
              >
                <Typography component="span" noWrap sx={{ minWidth: 0 }}>
                  {player.name}
                </Typography>
                <Box sx={{ flexShrink: 0 }}>
                  <ClaimedStatusChip
                    claimedByUserId={player.claimedByUserId}
                    currentUserId={currentUserId}
                  />
                </Box>
              </Stack>
            }
          />
        </ListItemButton>
      )}
    </ListItem>
  );
}

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

  const claimedPlayers = players
    .filter((player) => player.claimedByUserId !== null)
    .sort(byName);
  const guestPlayers = players
    .filter((player) => player.claimedByUserId === null)
    .sort(byName);

  const handlePlayerAdded = (player: Player) => {
    setPlayers((prev) => [...prev, player]);
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
        <>
          {claimedPlayers.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Claimed
              </Typography>
              <List
                component={Paper}
                variant="outlined"
                disablePadding
                sx={{ mb: 3 }}
              >
                {claimedPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    editing={editingId === player.id}
                    draftName={draftName}
                    onDraftNameChange={setDraftName}
                    onStartEdit={() => startEdit(player)}
                    onSaveEdit={() => void saveEdit(player.id)}
                    onCancelEdit={cancelEdit}
                    onDeleteRequest={() => setDeleteTarget(player)}
                    canEdit={canEdit(player)}
                    currentUserId={user?.id}
                  />
                ))}
              </List>
            </>
          )}

          {guestPlayers.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                Guests
              </Typography>
              <List component={Paper} variant="outlined" disablePadding>
                {guestPlayers.map((player) => (
                  <PlayerRow
                    key={player.id}
                    player={player}
                    editing={editingId === player.id}
                    draftName={draftName}
                    onDraftNameChange={setDraftName}
                    onStartEdit={() => startEdit(player)}
                    onSaveEdit={() => void saveEdit(player.id)}
                    onCancelEdit={cancelEdit}
                    onDeleteRequest={() => setDeleteTarget(player)}
                    canEdit={canEdit(player)}
                    currentUserId={user?.id}
                  />
                ))}
              </List>
            </>
          )}

          {players.length === 0 && (
            <Typography color="text.secondary">
              No players yet — add one above.
            </Typography>
          )}
        </>
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
