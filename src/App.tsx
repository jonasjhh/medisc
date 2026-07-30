import {
  BrowserRouter,
  Link as RouterLink,
  Route,
  Routes,
} from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Button from "@mui/material/Button";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { HomePage } from "./pages/HomePage";
import { CoursesPage } from "./courses/CoursesPage";
import { CourseDetailPage } from "./courses/CourseDetailPage";
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
        <Button color="inherit" component={RouterLink} to="/courses">
          Courses
        </Button>
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
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}
