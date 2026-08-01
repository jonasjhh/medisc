import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ThemeModeContext } from "./useThemeMode";
import type { ResolvedMode, ThemeModePreference } from "./useThemeMode";

const STORAGE_KEY = "medisc-theme-mode";

function readStoredPreference(): ThemeModePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : "system";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemeModePreference>(readStoredPreference);
  const [systemPrefersDark, setSystemPrefersDark] = useState(prefersDark);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemPrefersDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const setPreference = (next: ThemeModePreference) => {
    setPreferenceState(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  const resolvedMode: ResolvedMode =
    preference === "system"
      ? systemPrefersDark
        ? "dark"
        : "light"
      : preference;

  const value = useMemo(
    () => ({ preference, resolvedMode, setPreference }),
    [preference, resolvedMode],
  );

  return (
    <ThemeModeContext.Provider value={value}>
      {children}
    </ThemeModeContext.Provider>
  );
}
