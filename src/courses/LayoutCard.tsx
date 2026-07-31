import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { chunk } from "../shared/chunk";
import type { Hole, Layout } from "./api";

const HOLES_PER_GROUP = 9;

function HoleGroupTable({
  holes,
  caption,
}: {
  holes: Hole[];
  caption: string;
}) {
  return (
    <Table
      size="small"
      aria-label={caption}
      sx={{
        "& td, & th": { px: 0.75, py: 0.25, fontSize: "0.8125rem" },
      }}
    >
      <TableBody>
        <TableRow>
          <TableCell component="th" scope="row">
            Hole
          </TableCell>
          {holes.map((hole) => (
            <TableCell key={hole.id} align="center">
              {hole.number}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Dist.
          </TableCell>
          {holes.map((hole) => (
            <TableCell key={hole.id} align="center">
              {hole.distanceMeters ?? "—"}
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          <TableCell component="th" scope="row">
            Par
          </TableCell>
          {holes.map((hole) => (
            <TableCell key={hole.id} align="center">
              {hole.par}
            </TableCell>
          ))}
        </TableRow>
      </TableBody>
    </Table>
  );
}

export function LayoutCard({ layout }: { layout: Layout }) {
  const groups = chunk(layout.holes, HOLES_PER_GROUP);

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        {layout.name}
      </Typography>

      {groups.length > 0 ? (
        <Stack spacing={1.5}>
          {groups.map((holes) => (
            <Box key={holes[0].id} sx={{ overflowX: "auto" }}>
              <HoleGroupTable
                holes={holes}
                caption={`${layout.name}, holes ${holes[0].number}–${holes[holes.length - 1].number}`}
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No holes yet.
        </Typography>
      )}
    </Paper>
  );
}
