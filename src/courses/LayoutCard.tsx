import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import type { Layout } from "./api";

export function LayoutCard({ layout }: { layout: Layout }) {
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
                  hole.distanceMeters ? `${hole.distanceMeters} m` : undefined
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
    </Paper>
  );
}
