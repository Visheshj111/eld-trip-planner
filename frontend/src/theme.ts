import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

export const getDesignTokens = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === "light"
      ? {
        primary: {
          main: "#2563EB",
          light: "#3B82F6",
          dark: "#1D4ED8",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#F1F5F9",
          light: "#F8FAFC",
          dark: "#E2E8F0",
          contrastText: "#0F172A",
        },
        background: {
          default: "#F4F5F7",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#0F172A",
          secondary: "#64748B",
        },
        divider: "#E2E8F0",
      }
      : {
        primary: {
          main: "#3B82F6",
          light: "#60A5FA",
          dark: "#2563EB",
          contrastText: "#FFFFFF",
        },
        secondary: {
          main: "#1E293B",
          light: "#334155",
          dark: "#0F172A",
          contrastText: "#F8FAFC",
        },
        background: {
          default: "#0F172A",
          paper: "#1E293B",
        },
        text: {
          primary: "#F8FAFC",
          secondary: "#94A3B8",
        },
        divider: "#334155",
      }),
    error: {
      main: "#EF4444",
    },
    warning: {
      main: "#F59E0B",
    },
    success: {
      main: "#10B981",
    },
    info: {
      main: "#3B82F6",
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: "none" as const },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          border: mode === "light" ? "1px solid #E2E8F0" : "1px solid #334155",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: mode === "light" ? "#FFFFFF" : "#0F172A",
            "& fieldset": {
              borderColor: mode === "light" ? "#E2E8F0" : "#334155",
            },
            "&:hover fieldset": {
              borderColor: mode === "light" ? "#CBD5E1" : "#475569",
            },
            "&.Mui-focused fieldset": {
              borderColor: mode === "light" ? "#2563EB" : "#3B82F6",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#FFFFFF" : "#1E293B",
          color: mode === "light" ? "#0F172A" : "#F8FAFC",
          "&.Mui-expanded": {
            margin: 0,
          },
        },
      },
    },
  },
});

export const theme = createTheme(getDesignTokens("light"));
export default theme;
