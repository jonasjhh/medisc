import { type FormEvent, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { createHole, type Layout } from "./api";

export function LayoutCard({
  layout,
  onHoleAdded,
}: {
  layout: Layout;
  onHoleAdded: () => void;
}) {
  const [number, setNumber] = useState("");
  const [par, setPar] = useState("");
  const [distance, setDistance] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await createHole(layout.id, {
        number: Number(number),
        par: Number(par),
        distanceFeet: distance ? Number(distance) : null,
      });
      setNumber("");
      setPar("");
      setDistance("");
      onHoleAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add hole");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {layout.name}
      </Typography>

      {layout.holes.length > 0 ? (
        <List dense disablePadding>
          {layout.holes.map((hole) => (
            <ListItem key={hole.id} disableGutters>
              <ListItemText
                primary={`Hole ${hole.number} — Par ${hole.par}`}
                secondary={
                  hole.distanceFeet ? `${hole.distanceFeet} ft` : undefined
                }
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No holes yet.
        </Typography>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1.5 }}
      >
        <TextField
          label="Hole #"
          type="number"
          size="small"
          value={number}
          onChange={(event) => setNumber(event.target.value)}
          sx={{ width: 90 }}
          required
        />
        <TextField
          label="Par"
          type="number"
          size="small"
          value={par}
          onChange={(event) => setPar(event.target.value)}
          sx={{ width: 90 }}
          required
        />
        <TextField
          label="Distance (ft)"
          type="number"
          size="small"
          value={distance}
          onChange={(event) => setDistance(event.target.value)}
          sx={{ width: 140 }}
        />
        <Button type="submit" variant="outlined" disabled={submitting}>
          Add hole
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {error}
        </Alert>
      )}
    </Paper>
  );
}
