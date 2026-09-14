"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

/** Light mode has been removed — dark is the only theme. */
type EffectiveTheme = "dark";

const STORAGE_KEY = "bw-theme";

function applyTheme(theme: EffectiveTheme) {
  document.documentElement.setAttribute("data-theme", theme);
}

const ThemeContext = createContext<{
  /** Always "dark" — kept so existing consumers (e.g. UserDropdown's
   *  Appearance switch) don't need to change. */
  theme: EffectiveTheme;
  /** No-op — nothing to toggle to. */
  toggleTheme: () => void;
}>({
  theme: "dark",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

/** Forces dark mode unconditionally, ignoring localStorage and system
 *  preference. Any stale non-"dark" localStorage value is normalized to
 *  "dark" on mount. Kept as a provider (rather than removed outright) so
 *  other components can keep reading `theme`/`toggleTheme` via useTheme(). */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    applyTheme("dark");
    if (localStorage.getItem(STORAGE_KEY) !== "dark") {
      localStorage.setItem(STORAGE_KEY, "dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    // No-op — dark is the only theme.
  }, []);

  // Prevent flash by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme: "dark", toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
