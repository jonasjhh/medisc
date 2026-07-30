import { createTheme, type Theme } from "@mui/material/styles";

// A fairway-green identity in place of MUI's generic M3 "Baseline" purple:
// neutral grays for surfaces/text, green reserved for brand + birdie scores,
// amber for bogey, so color always signals something rather than decorating.
export function createAppTheme(mode: "light" | "dark"): Theme {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#7bc99a" : "#2e6e4e",
        contrastText: isDark ? "#0b2016" : "#ffffff",
      },
      secondary: {
        main: isDark ? "#b8c4b0" : "#55624f",
        contrastText: isDark ? "#1a2117" : "#ffffff",
      },
      success: {
        main: isDark ? "#66bb6a" : "#2e7d32",
      },
      warning: {
        main: isDark ? "#ffa726" : "#c56a00",
      },
      error: {
        main: isDark ? "#ffb4ab" : "#ba1a1a",
      },
      background: {
        default: isDark ? "#121212" : "#f6f7f5",
        paper: isDark ? "#1e1e1e" : "#ffffff",
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: [
        "Roboto",
        "'Segoe UI'",
        "system-ui",
        "-apple-system",
        "sans-serif",
      ].join(","),
    },
    components: {
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            textTransform: "none",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
          },
        },
      },
    },
  });
}
