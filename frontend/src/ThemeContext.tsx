import React, { createContext, useState, useMemo, useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { getDesignTokens, type AccentColor } from "./theme";
import useMediaQuery from "@mui/material/useMediaQuery";

export type ThemeMode = "light" | "dark" | "system";
export type Unit = "mi" | "km";
export type MapLayer = "osm" | "satellite" | "terrain";
export type { AccentColor };

interface ThemeContextType {
  mode: "light" | "dark";
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleColorMode: () => void;
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  unit: Unit;
  setUnit: (unit: Unit) => void;
  mapLayer: MapLayer;
  setMapLayer: (layer: MapLayer) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "light",
  themeMode: "system",
  setThemeMode: () => {},
  toggleColorMode: () => {},
  accentColor: "teal",
  setAccentColor: () => {},
  unit: "mi",
  setUnit: () => {},
  mapLayer: "osm",
  setMapLayer: () => {},
});

export function ThemeContextProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem("themeMode") as ThemeMode) || "system";
  });
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem("accentColor") as AccentColor) || "teal";
  });
  const [unit, setUnit] = useState<Unit>(() => {
    return (localStorage.getItem("unit") as Unit) || "mi";
  });
  const [mapLayer, setMapLayer] = useState<MapLayer>(() => {
    return (localStorage.getItem("mapLayer") as MapLayer) || "osm";
  });

  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  useEffect(() => {
    localStorage.setItem("themeMode", themeMode);
    localStorage.setItem("accentColor", accentColor);
    localStorage.setItem("unit", unit);
    localStorage.setItem("mapLayer", mapLayer);
  }, [themeMode, accentColor, unit, mapLayer]);

  const mode = themeMode === "system" ? (prefersDarkMode ? "dark" : "light") : themeMode;

  const toggleColorMode = () => {
    setThemeMode((prev) => {
      if (prev === "system") return prefersDarkMode ? "light" : "dark";
      return prev === "light" ? "dark" : "light";
    });
  };

  const theme = useMemo(() => createTheme(getDesignTokens(mode, accentColor)), [mode, accentColor]);

  return (
    <ThemeContext.Provider value={{ mode, themeMode, setThemeMode, toggleColorMode, accentColor, setAccentColor, unit, setUnit, mapLayer, setMapLayer }}>
      <ThemeProvider theme={theme}>{children}</ThemeProvider>
    </ThemeContext.Provider>
  );
}
