import { useState } from "react";
import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
} from "react-router-dom";
import BrightnessAutoIcon from "@mui/icons-material/BrightnessAuto";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import DevicesIcon from "@mui/icons-material/Devices";
import LightModeIcon from "@mui/icons-material/LightMode";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { HomePage } from "./pages/HomePage";
import { CoursesPage } from "./courses/CoursesPage";
import { NewRoundPage } from "./rounds/NewRoundPage";
import { RoundPage } from "./rounds/RoundPage";
import { RoundsListPage } from "./rounds/RoundsListPage";
import { PlayersListPage } from "./players/PlayersListPage";
import { PlayerStatsPage } from "./players/PlayerStatsPage";
import { HoleBreakdownPage } from "./players/HoleBreakdownPage";
import { InstallPrompt } from "./app/InstallPrompt";
import { OfflineBanner } from "./app/OfflineBanner";
import { UpdatePrompt } from "./app/UpdatePrompt";
import { useThemeMode } from "./app/useThemeMode";
import type { ThemeModePreference } from "./app/useThemeMode";
import { IdentityModal } from "./identity/IdentityModal";
import { LinkCodeDialog } from "./identity/LinkCodeDialog";
import { UnclaimDialog } from "./identity/UnclaimDialog";
import { useIdentity } from "./identity/useIdentity";
import { HoleScoreSyncToast } from "./rounds/HoleScoreSyncToast";
import { useHoleScoreQueueSync } from "./rounds/useHoleScoreQueue";

const modeIcons: Record<ThemeModePreference, typeof LightModeIcon> = {
  light: LightModeIcon,
  dark: DarkModeIcon,
  system: BrightnessAutoIcon,
};

function ThemeModeMenu() {
  const { preference, setPreference } = useThemeMode();
  const { status, user, openOnboarding } = useIdentity();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [linkCodeOpen, setLinkCodeOpen] = useState(false);
  const [unclaimOpen, setUnclaimOpen] = useState(false);
  const CurrentIcon = modeIcons[preference];

  const choose = (next: ThemeModePreference) => {
    setPreference(next);
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        color="inherit"
        aria-label="theme mode"
        onClick={(event) => setAnchorEl(event.currentTarget)}
      >
        <CurrentIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={anchorEl !== null}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          selected={preference === "light"}
          onClick={() => choose("light")}
        >
          <ListItemIcon>
            <LightModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Light</ListItemText>
        </MenuItem>
        <MenuItem
          selected={preference === "dark"}
          onClick={() => choose("dark")}
        >
          <ListItemIcon>
            <DarkModeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Dark</ListItemText>
        </MenuItem>
        <MenuItem
          selected={preference === "system"}
          onClick={() => choose("system")}
        >
          <ListItemIcon>
            <BrightnessAutoIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>System</ListItemText>
        </MenuItem>
        {status === "ready" && (
          <>
            <Divider />
            {user === null && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  openOnboarding("welcome");
                }}
              >
                <ListItemIcon>
                  <PersonAddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Set up profile</ListItemText>
              </MenuItem>
            )}
            {user !== null && user.claimedPlayer === null && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  openOnboarding("claim");
                }}
              >
                <ListItemIcon>
                  <PersonSearchIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Claim a guest profile</ListItemText>
              </MenuItem>
            )}
            {user !== null && user.claimedPlayer !== null && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setUnclaimOpen(true);
                }}
              >
                <ListItemIcon>
                  <PersonSearchIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>
                  Playing as {user.claimedPlayer.name} — this isn&apos;t me
                </ListItemText>
              </MenuItem>
            )}
            {user !== null && (
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  setLinkCodeOpen(true);
                }}
              >
                <ListItemIcon>
                  <DevicesIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Link another device</ListItemText>
              </MenuItem>
            )}
          </>
        )}
      </Menu>
      <LinkCodeDialog
        open={linkCodeOpen}
        onClose={() => setLinkCodeOpen(false)}
      />
      <UnclaimDialog open={unclaimOpen} onClose={() => setUnclaimOpen(false)} />
    </>
  );
}

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
        <ThemeModeMenu />
      </Toolbar>
    </AppBar>
  );
}

export function App() {
  useHoleScoreQueueSync();

  return (
    <BrowserRouter
      basename={import.meta.env.BASE_URL}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <OfflineBanner />
      <UpdatePrompt />
      <InstallPrompt />
      <IdentityModal />
      <HoleScoreSyncToast />
      <NavBar />
      <Box component="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/rounds" element={<RoundsListPage />} />
          <Route path="/rounds/new" element={<NewRoundPage />} />
          <Route path="/rounds/:roundId" element={<RoundPage />} />
          <Route path="/players" element={<PlayersListPage />} />
          <Route path="/players/:playerId" element={<PlayerStatsPage />} />
          <Route
            path="/players/:playerId/holes/:holeId"
            element={<HoleBreakdownPage />}
          />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}
