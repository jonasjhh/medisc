import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { App } from "../App";
import { createAppTheme } from "./theme";
import { useThemeMode } from "./useThemeMode";

export function ThemedApp() {
  const { resolvedMode } = useThemeMode();
  return (
    <ThemeProvider theme={createAppTheme(resolvedMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}
