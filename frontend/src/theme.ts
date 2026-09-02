import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
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
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontWeight: 700, color: "#0F172A" },
    h2: { fontWeight: 700, color: "#0F172A" },
    h3: { fontWeight: 600, color: "#0F172A" },
    h4: { fontWeight: 600, color: "#0F172A" },
    h5: { fontWeight: 600, color: "#0F172A" },
    h6: { fontWeight: 600, color: "#0F172A" },
    button: { fontWeight: 600, textTransform: "none" as const },
    body2: { color: "#64748B" },
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
          border: "1px solid #E2E8F0",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            backgroundColor: "#FFFFFF",
            "& fieldset": {
              borderColor: "#E2E8F0",
            },
            "&:hover fieldset": {
              borderColor: "#CBD5E1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2563EB",
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
  },
});

export default theme;
