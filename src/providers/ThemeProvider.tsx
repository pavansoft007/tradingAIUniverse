"use client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { type ReactNode } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { darkTheme, lightTheme } from "@/styles/theme";

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode } = useThemeStore();
  const theme = mode === "dark" ? darkTheme : lightTheme;

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  );
}
