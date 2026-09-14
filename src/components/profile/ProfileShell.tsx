import styles from "./ProfileShell.module.css";

/** Shared horizontal-padding + max-width wrapper for the profile area's
 *  header, nav, and settings surfaces — keeps them a consistent, wider
 *  "app" width rather than the narrow reading column. */
export function ProfileShell({ children }: { children: React.ReactNode }) {
  return <div className={styles.shell}>{children}</div>;
}
