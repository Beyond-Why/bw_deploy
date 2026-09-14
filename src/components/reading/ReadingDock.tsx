import styles from "./ReadingDock.module.css";

interface ReadingDockProps {
  mode: "focus" | "explore";
  onFocus: () => void;
  onExplore: () => void;
}

export function ReadingDock({ mode, onFocus, onExplore }: ReadingDockProps) {
  return (
    <div className={styles.dock} role="toolbar" aria-label="Reading mode controls">

      {/* ── User / profile icon (static, decorative) ── */}
      <button className={styles.dockBtn} aria-label="Profile" tabIndex={-1}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
      </button>

      {/* ── Home ── */}
      <a href="/" className={styles.dockBtn} aria-label="Home">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 12L12 3l9 9" />
          <path d="M9 21V12h6v9" />
          <path d="M5 10v11h14V10" />
        </svg>
      </a>

      {/* ── Search (placeholder, no search system yet) ── */}
      <button className={styles.dockBtn} aria-label="Search" tabIndex={-1}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="22" y2="22" />
        </svg>
      </button>

      {/* ── Separator ── */}
      <span className={styles.separator} aria-hidden="true" />

      {/* ── Focus mode button ── */}
      <button
        className={`${styles.dockBtn} ${mode === "focus" ? styles.dockBtnActive : ""}`}
        onClick={onFocus}
        aria-label="Focus mode — single column reading"
        aria-pressed={mode === "focus"}
      >
        {/* Single column / book open icon */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      </button>

      {/* ── Explore mode button ── */}
      <button
        className={`${styles.dockBtn} ${mode === "explore" ? styles.dockBtnActive : ""}`}
        onClick={onExplore}
        aria-label="Explore mode — split view with sidebar"
        aria-pressed={mode === "explore"}
      >
        {/* Split-view / layout columns icon — same as focus entry button */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      </button>
    </div>
  );
}
