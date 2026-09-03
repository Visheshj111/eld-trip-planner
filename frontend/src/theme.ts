import { createTheme } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

export type AccentColor = "teal" | "blue" | "purple" | "orange" | "black";

const ACCENT_COLORS = {
  light: {
    teal: { main: "#0D9488", light: "#14B8A6", dark: "#0F766E" },
    blue: { main: "#2563EB", light: "#3B82F6", dark: "#1D4ED8" },
    purple: { main: "#7C3AED", light: "#8B5CF6", dark: "#6D28D9" },
    orange: { main: "#EA580C", light: "#F97316", dark: "#C2410C" },
    black: { main: "#000000", light: "#333333", dark: "#000000" },
  },
  dark: {
    teal: { main: "#14B8A6", light: "#2DD4BF", dark: "#0D9488" },
    blue: { main: "#3B82F6", light: "#60A5FA", dark: "#2563EB" },
    purple: { main: "#8B5CF6", light: "#A78BFA", dark: "#7C3AED" },
    orange: { main: "#F97316", light: "#FB923C", dark: "#EA580C" },
    black: { main: "#FFFFFF", light: "#FFFFFF", dark: "#CCCCCC" },
  }
};

export const getDesignTokens = (mode: "light" | "dark", accent: AccentColor = "teal"): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      ...ACCENT_COLORS[mode][accent],
      contrastText: (mode === "dark" && accent === "black") ? "#0C0A09" : "#FFFFFF",
    },
    ...(mode === "light"
      ? {
        secondary: {
          main: "#F5F3EF",
          light: "#FAF9F7",
          dark: "#E7E4DE",
          contrastText: "#1C1917",
        },
        background: {
          default: "#FAFAF9",
          paper: "#FFFFFF",
        },
        text: {
          primary: "#1C1917",
          secondary: "#78716C",
        },
        divider: "#E7E5E4",
      }
      : {
        secondary: {
          main: "#1C1917",
          light: "#292524",
          dark: "#0C0A09",
          contrastText: "#FAFAF9",
        },
        background: {
          default: "#0C0A09",
          paper: "#1C1917",
        },
        text: {
          primary: "#FAFAF9",
          secondary: "#A8A29E",
        },
        divider: "#292524",
      }),
    error: {
      main: "#DC2626",
    },
    warning: {
      main: "#D97706",
    },
    success: {
      main: "#059669",
    },
    info: {
      main: "#0891B2",
    },
  },
  typography: {
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h2: { fontFamily: "'Outfit', sans-serif", fontWeight: 700 },
    h3: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h4: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h5: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    h6: { fontFamily: "'Outfit', sans-serif", fontWeight: 600 },
    button: { fontFamily: "'DM Sans', sans-serif", fontWeight: 600, textTransform: "none" as const },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fillBar {
          from { width: 0%; }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); }
      `,
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "10px 24px",
          fontSize: "0.875rem",
          boxShadow: "none",
          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "none",
            transform: "translateY(-1px)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: mode === "light"
            ? "0 1px 3px rgba(28, 25, 23, 0.06), 0 1px 2px rgba(28, 25, 23, 0.04)"
            : "0 1px 3px rgba(0, 0, 0, 0.3)",
          border: mode === "light" ? "1px solid #E7E5E4" : "1px solid #292524",
          transition: "box-shadow 0.2s ease, transform 0.2s ease",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 10,
            backgroundColor: mode === "light" ? "#FFFFFF" : "#0C0A09",
            transition: "box-shadow 0.2s ease",
            "& fieldset": {
              borderColor: mode === "light" ? "#E7E5E4" : "#292524",
              transition: "border-color 0.2s ease",
            },
            "&:hover fieldset": {
              borderColor: mode === "light" ? "#D6D3D1" : "#44403C",
            },
            "&.Mui-focused fieldset": {
              borderColor: mode === "light" ? "#0D9488" : "#14B8A6",
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
          borderRadius: 8,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#FFFFFF" : "#1C1917",
          color: mode === "light" ? "#1C1917" : "#FAFAF9",
          transition: "background-color 0.2s ease",
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
