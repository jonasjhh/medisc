import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useVisitCount } from "../storage/useVisitCount";

export function HomePage() {
  const visitCount = useVisitCount();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" fontWeight={600}>
          Hello, world!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Medisc is up and running as an installable, offline-ready PWA.
        </Typography>
        <Stack
          direction="row"
          spacing={1}
          flexWrap="wrap"
          justifyContent="center"
        >
          <Chip label="React" />
          <Chip label="Material Design 3" />
          <Chip label="PWA" />
        </Stack>
        {visitCount !== null && (
          <Typography variant="body2" color="text.secondary">
            Stored locally with localforage — visit #{visitCount}
          </Typography>
        )}
      </Box>
    </Container>
  );
}
