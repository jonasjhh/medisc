import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScoreBadge } from "./ScoreBadge";

// Kept narrow and truncated on mobile so the label column doesn't push the
// 9 fixed hole columns past what fits on a portrait phone without scrolling
// — the full name is always visible elsewhere (header, Players card).
const labelColSx = {
  maxWidth: { xs: 64, sm: "none" },
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

export function ScorecardGroupTable({
  holes,
  players,
  scoreByKey,
}: {
  holes: RoundHole[];
  players: RoundPlayer[];
  scoreByKey: Map<string, RoundScore>;
}) {
  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size="small"
        aria-label={`Scorecard summary, holes ${holes[0].number}–${holes[holes.length - 1].number}`}
        sx={{
          "& td, & th": {
            px: { xs: 0.5, sm: 0.75 },
            py: { xs: 0.25, sm: 0.5 },
            fontSize: { xs: "0.6875rem", sm: "0.8125rem" },
          },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell sx={labelColSx}>Hole</TableCell>
            {holes.map((roundHole) => (
              <TableCell key={roundHole.id} align="center">
                {roundHole.number}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell sx={{ ...labelColSx, color: "text.secondary" }}>
              Par
            </TableCell>
            {holes.map((roundHole) => (
              <TableCell
                key={roundHole.id}
                align="center"
                sx={{ color: "text.secondary" }}
              >
                {roundHole.par}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {players.map((player) => (
            <TableRow key={player.id}>
              <TableCell component="th" scope="row" sx={labelColSx}>
                {player.name}
              </TableCell>
              {holes.map((roundHole) => {
                const score = scoreByKey.get(`${roundHole.id}:${player.id}`);
                return (
                  <TableCell key={roundHole.id} align="center">
                    {score && (
                      <ScoreBadge
                        strokes={score.strokes}
                        par={roundHole.par}
                        recorded={score.recorded}
                      />
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
