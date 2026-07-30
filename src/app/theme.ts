import { createTheme } from "@mui/material/styles";

// Material Design 3 "Baseline" tonal palette (source color #6750A4), mapped
// onto MUI's theming API since MUI does not ship native M3 tokens.
export const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#6750a4", contrastText: "#ffffff" },
    secondary: { main: "#625b71", contrastText: "#ffffff" },
    error: { main: "#ba1a1a" },
    background: { default: "#fffbfe", paper: "#fffbfe" },
  },
  shape: {
    borderRadius: 16,
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
          borderRadius: 100,
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
