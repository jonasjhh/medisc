import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Hole, Layout } from "./api";

function HoleTable({ holes, caption }: { holes: Hole[]; caption: string }) {
  return (
    <Table
      size="small"
      aria-label={caption}
      sx={{
        width: "auto",
        "& td, & th": { px: 0.75, py: 0.25, fontSize: "0.8125rem" },
      }}
    >
      <TableHead>
        <TableRow>
          <TableCell>Hole</TableCell>
          <TableCell align="right">Par</TableCell>
          <TableCell align="right">Dist.</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {holes.map((hole) => (
          <TableRow key={hole.id}>
            <TableCell>{hole.number}</TableCell>
            <TableCell align="right">{hole.par}</TableCell>
            <TableCell align="right">
              {hole.distanceMeters ? `${hole.distanceMeters} m` : "—"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function LayoutCard({ layout }: { layout: Layout }) {
  const half = Math.ceil(layout.holes.length / 2);
  const front = layout.holes.slice(0, half);
  const back = layout.holes.slice(half);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {layout.name}
      </Typography>

      {layout.holes.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            columnGap: 1,
            rowGap: 1,
            overflowX: "auto",
          }}
        >
          <HoleTable
            holes={front}
            caption={`${layout.name}, holes 1–${half}`}
          />
          {back.length > 0 && (
            <HoleTable
              holes={back}
              caption={`${layout.name}, holes ${half + 1}–${layout.holes.length}`}
            />
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No holes yet.
        </Typography>
      )}
    </Paper>
  );
}
