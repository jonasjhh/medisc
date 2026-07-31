import Box from "@mui/material/Box";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { RoundHole, RoundPlayer, RoundScore } from "./api";
import { ScoreBadge } from "./ScoreBadge";

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
          "& td, & th": { px: 0.75, py: 0.5, fontSize: "0.8125rem" },
        }}
      >
        <TableHead>
          <TableRow>
            <TableCell>Hole</TableCell>
            {holes.map((roundHole) => (
              <TableCell key={roundHole.id} align="center">
                {roundHole.number}
              </TableCell>
            ))}
          </TableRow>
          <TableRow>
            <TableCell sx={{ color: "text.secondary" }}>Par</TableCell>
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
              <TableCell component="th" scope="row">
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
