"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";

type Theme = "dark" | "light";

/** Dev-only: flips <html data-theme> so both themes can be checked
 *  (also ?theme=light, for screenshots). The site's ThemeProvider forces
 *  dark on mount, so the initial flip waits a tick to run after it.
 *  Nothing is persisted. */
export function ThemeSwitch({ initial = "dark" }: { initial?: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const id = setTimeout(() => document.documentElement.setAttribute("data-theme", initial), 0);
    return () => clearTimeout(id);
  }, [initial]);

  const flip = (next: Theme) => {
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <div className={styles.switch} role="group" aria-label="Theme">
      {(["dark", "light"] as const).map((t) => (
        <button key={t} type="button" aria-pressed={theme === t} onClick={() => flip(t)}>
          {t === "dark" ? "Dark" : "Light"}
        </button>
      ))}
    </div>
  );
}
