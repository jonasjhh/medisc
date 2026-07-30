import { Link as RouterLink } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

export function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "calc(100dvh - 64px)",
          py: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 3,
        }}
      >
        <Typography variant="h3" component="h1" fontWeight={600}>
          Medisc
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your disc golf rounds, hole by hole.
        </Typography>
        <Stack
          direction="row"
          spacing={2}
          flexWrap="wrap"
          justifyContent="center"
        >
          <Button
            variant="contained"
            component={RouterLink}
            to="/rounds/new"
            size="large"
          >
            Start a round
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to="/courses"
            size="large"
          >
            Courses
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
