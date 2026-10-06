"use client";

import { createContext, type ReactNode, useContext, useEffect } from "react";

// The dashboard is light only (design/app-language.md §3, decision D4). This keeps useTheme()'s shape for
// the header's old theme menu until the new shell (task C1) replaces it; task B4's second pull request then
// deletes this file. Nothing here adds a `dark` class, so a system set to dark gets the light app.

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const LIGHT: ThemeContextType = {
  theme: "light",
  setTheme: () => {},
  resolvedTheme: "light",
};

const ThemeContext = createContext<ThemeContextType>(LIGHT);

/** Where the old theme choice was saved; cleared so a stale "dark" is not read by anything later. */
const THEME_STORAGE_KEY = "wrext-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      // Storage blocked: nothing was saved there either.
    }
  }, []);

  return (
    <ThemeContext.Provider value={LIGHT}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
