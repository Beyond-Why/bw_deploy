import type { ReactNode } from "react";
import styles from "./Toggle.module.css";

/**
 * "Under the hood" — the technical detail of a Builder Log day, closed
 * by default. A native <details>, so it opens with a click, Enter or
 * Space and needs no client JavaScript. Code, KaTeX and ```mermaid
 * blocks all work inside.
 *
 *   <Toggle title="Sensor readings and how the threshold is picked">
 *
 *   Each sensor gives a reading from 0 to 1023 …
 *
 *   </Toggle>
 */
export default function Toggle({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <details className={styles.toggle}>
      <summary className={styles.summary}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
          </svg>
        </span>
        <span className={styles.heading}>
          <span className={styles.kicker}>Under the hood</span>
          {title && <span className={styles.title}>{title}</span>}
        </span>
        <span className={styles.plus} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
