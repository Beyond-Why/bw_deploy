import styles from "./AuthBrandPanel.module.css";

/**
 * Left-side branding panel shared by every auth page (signin, signup,
 * forgot-password, reset-password) — desktop only, hidden on mobile
 * (see each page's own layout CSS for the breakpoint). Pure CSS, no
 * image assets: just the wordmark and a tagline over a layered gradient
 * standing in for a subtle noise/glow texture.
 */
export function AuthBrandPanel({
  tagline = "Think deeper. Read better.",
}: {
  tagline?: string;
}) {
  return (
    <div className={styles.panel}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <p className={styles.wordmark}>Beyond Why</p>
        <p className={styles.tagline}>{tagline}</p>
      </div>
    </div>
  );
}
