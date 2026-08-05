import { useEffect, useState } from "react";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { listPlayers } from "../players/api";
import type { Player } from "../players/api";
import { updateRound } from "./api";
import type { RoundDetail, RoundPlayer } from "./api";

export function PlayerRosterPanel({
  round,
  onRoundUpdated,
  onError,
}: {
  round: RoundDetail;
  onRoundUpdated: (round: RoundDetail) => void;
  onError: (message: string | null) => void;
}) {
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [editingPlayers, setEditingPlayers] = useState(false);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(
    new Set(),
  );
  const [savingPlayers, setSavingPlayers] = useState(false);

  const [swapMenu, setSwapMenu] = useState<{
    anchorEl: HTMLElement;
    player: RoundPlayer;
  } | null>(null);
  const [swapping, setSwapping] = useState(false);

  useEffect(() => {
    void (async () => {
      const { players } = await listPlayers();
      setAllPlayers(players);
    })();
  }, []);

  const startEditingPlayers = () => {
    setSelectedPlayerIds(new Set(round.players.map((player) => player.id)));
    setEditingPlayers(true);
  };

  const togglePlayer = (playerId: number) => {
    setSelectedPlayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  const handleSavePlayers = async () => {
    if (selectedPlayerIds.size === 0) {
      return;
    }
    setSavingPlayers(true);
    onError(null);
    try {
      const updated = await updateRound(round.id, {
        playerIds: [...selectedPlayerIds],
      });
      onRoundUpdated(updated);
      setEditingPlayers(false);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update players");
    } finally {
      setSavingPlayers(false);
    }
  };

  const handleSwapPlayer = async (
    currentPlayerId: number,
    replacementPlayerId: number,
  ) => {
    setSwapMenu(null);
    setSwapping(true);
    onError(null);
    try {
      const nextPlayerIds = round.players.map((player) =>
        player.id === currentPlayerId ? replacementPlayerId : player.id,
      );
      const updated = await updateRound(round.id, {
        playerIds: nextPlayerIds,
      });
      onRoundUpdated(updated);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to swap player");
    } finally {
      setSwapping(false);
    }
  };

  const playersNotInRound = allPlayers.filter(
    (player) =>
      !round.players.some((roundPlayer) => roundPlayer.id === player.id),
  );

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1" fontWeight={600}>
            Players
          </Typography>
          {!editingPlayers && (
            <Button size="small" onClick={startEditingPlayers}>
              Manage players
            </Button>
          )}
        </Stack>

        {editingPlayers ? (
          <>
            <FormGroup>
              {allPlayers.map((player) => (
                <FormControlLabel
                  key={player.id}
                  control={
                    <Checkbox
                      checked={selectedPlayerIds.has(player.id)}
                      onChange={() => togglePlayer(player.id)}
                    />
                  }
                  label={player.name}
                />
              ))}
            </FormGroup>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                size="small"
                variant="contained"
                disabled={savingPlayers || selectedPlayerIds.size === 0}
                onClick={() => void handleSavePlayers()}
              >
                Save players
              </Button>
              <Button size="small" onClick={() => setEditingPlayers(false)}>
                Cancel
              </Button>
            </Stack>
          </>
        ) : (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {round.players.map((player) => (
              <Stack
                key={player.id}
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography color="text.secondary">{player.name}</Typography>
                <Tooltip
                  title={
                    playersNotInRound.length === 0
                      ? "No other players to swap in"
                      : `Swap ${player.name} for another player`
                  }
                >
                  <span>
                    <IconButton
                      size="small"
                      aria-label={`swap ${player.name}`}
                      disabled={playersNotInRound.length === 0 || swapping}
                      onClick={(event) =>
                        setSwapMenu({
                          anchorEl: event.currentTarget,
                          player,
                        })
                      }
                    >
                      <SwapHorizIcon fontSize="small" />
                    </IconButton>
                  </span>
                </Tooltip>
              </Stack>
            ))}
          </Stack>
        )}
      </Paper>

      <Menu
        anchorEl={swapMenu?.anchorEl ?? null}
        open={swapMenu !== null}
        onClose={() => setSwapMenu(null)}
      >
        {playersNotInRound.map((candidate) => (
          <MenuItem
            key={candidate.id}
            onClick={() =>
              swapMenu &&
              void handleSwapPlayer(swapMenu.player.id, candidate.id)
            }
          >
            {candidate.name}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
