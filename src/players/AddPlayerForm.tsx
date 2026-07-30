import { type FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { createPlayer } from "./api";
import type { Player } from "./api";

export function AddPlayerForm({
  onAdded,
}: {
  onAdded: (player: Player) => void;
}) {
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const player = await createPlayer(trimmed);
      onAdded(player);
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1 }}
      >
        <TextField
          label="Add player"
          size="small"
          fullWidth
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" variant="outlined" disabled={submitting}>
          Add
        </Button>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
