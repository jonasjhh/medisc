import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
} from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { HomePage } from "./pages/HomePage";
import { CoursesPage } from "./courses/CoursesPage";
import { CourseDetailPage } from "./courses/CourseDetailPage";
import { NewRoundPage } from "./rounds/NewRoundPage";
import { RoundPage } from "./rounds/RoundPage";
import { RoundsListPage } from "./rounds/RoundsListPage";
import { PlayersListPage } from "./players/PlayersListPage";
import { PlayerStatsPage } from "./players/PlayerStatsPage";
import { InstallPrompt } from "./app/InstallPrompt";
import { UpdatePrompt } from "./app/UpdatePrompt";

function NavBar() {
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ flexGrow: 1, color: "inherit", textDecoration: "none" }}
        >
          Medisc
        </Typography>
        <Stack direction="row" component="nav" aria-label="Main" spacing={0.5}>
          <Button color="inherit" component={RouterLink} to="/rounds">
            Rounds
          </Button>
          <Button color="inherit" component={RouterLink} to="/courses">
            Courses
          </Button>
          <Button color="inherit" component={RouterLink} to="/players">
            Players
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}

export function App() {
  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <UpdatePrompt />
      <InstallPrompt />
      <NavBar />
      <Box component="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseDetailPage />} />
          <Route path="/rounds" element={<RoundsListPage />} />
          <Route path="/rounds/new" element={<NewRoundPage />} />
          <Route path="/rounds/:roundId" element={<RoundPage />} />
          <Route path="/players" element={<PlayersListPage />} />
          <Route path="/players/:playerId" element={<PlayerStatsPage />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}
