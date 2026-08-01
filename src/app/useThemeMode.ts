import { createContext, useContext } from "react";

export type ThemeModePreference = "light" | "dark" | "system";
export type ResolvedMode = "light" | "dark";

export interface ThemeModeContextValue {
  preference: ThemeModePreference;
  resolvedMode: ResolvedMode;
  setPreference: (preference: ThemeModePreference) => void;
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(
  null,
);

export function useThemeMode(): ThemeModeContextValue {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeMode must be used within a ThemeModeProvider");
  }
  return context;
}
