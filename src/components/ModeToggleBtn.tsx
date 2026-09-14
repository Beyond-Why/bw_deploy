"use client";

import { useEffect, useState } from "react";
import styles from "./ModeToggleBtn.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Reads/writes the explore-mode-active class on <html> via custom events.
 * Lives in the shared navbar so it's always in the same place in both modes.
 *
 * Protocol:
 *   EpisodeReader → dispatches "explore-mode-change" with detail { explore: boolean }
 *   ModeToggleBtn → on click, dispatches "explore-toggle" (no detail)
 *
 * On pages that have no EpisodeReader the toggle is hidden (visible = false).
 */
export function ModeToggleBtn() {
  const [isExplore, setIsExplore] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onModeChange = (e: Event) => {
      const detail = (e as CustomEvent<{ explore: boolean }>).detail;
      setIsExplore(detail.explore);
      setVisible(true);
      // Lets the navbar realign itself for Explore mode's full-bleed split
      // layout (see Navigation.module.css) — the same class this file's
      // own docstring already promised, now actually applied.
      document.documentElement.classList.toggle("explore-mode-active", detail.explore);
    };

    const onReaderMounted = () => setVisible(true);
    const onReaderUnmounted = () => {
      setVisible(false);
      document.documentElement.classList.remove("explore-mode-active");
    };

    window.addEventListener("explore-mode-change", onModeChange);
    window.addEventListener("episode-reader-mounted", onReaderMounted);
    window.addEventListener("episode-reader-unmounted", onReaderUnmounted);

    return () => {
      window.removeEventListener("explore-mode-change", onModeChange);
      window.removeEventListener("episode-reader-mounted", onReaderMounted);
      window.removeEventListener("episode-reader-unmounted", onReaderUnmounted);
    };
  }, []);

  if (!visible) return null;

  const handleSelect = (target: "explore" | "focus") => {
    if (target === (isExplore ? "explore" : "focus")) return;
    window.dispatchEvent(new CustomEvent("explore-toggle"));
  };

  return (
    <div className={styles.pill} role="group" aria-label="Reading mode">
      <button
        type="button"
        className={cx(styles.segment, isExplore && styles.segmentActive)}
        aria-pressed={isExplore}
        onClick={() => handleSelect("explore")}
      >
        Explore
      </button>
      <button
        type="button"
        className={cx(styles.segment, !isExplore && styles.segmentActive)}
        aria-pressed={!isExplore}
        onClick={() => handleSelect("focus")}
      >
        Focus
      </button>
    </div>
  );
}
