import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeModeProvider } from "./app/ThemeModeContext";
import { InstallPromptProvider } from "./app/InstallPromptContext";
import { ThemedApp } from "./app/ThemedApp";
import { IdentityProvider } from "./identity/IdentityContext";

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
