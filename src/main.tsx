import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { App } from "./App";
import { createAppTheme } from "./app/theme";
import { ThemeModeProvider, useThemeMode } from "./app/ThemeModeContext";
import { InstallPromptProvider } from "./app/InstallPromptContext";
import { IdentityProvider } from "./identity/IdentityContext";

function ThemedApp() {
  const { resolvedMode } = useThemeMode();
  return (
    <ThemeProvider theme={createAppTheme(resolvedMode)}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeModeProvider>
      <InstallPromptProvider>
        <IdentityProvider>
          <ThemedApp />
        </IdentityProvider>
      </InstallPromptProvider>
    </ThemeModeProvider>
  </StrictMode>,
);
