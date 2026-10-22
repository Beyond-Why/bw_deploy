import type { ReactNode } from "react";
import styles from "./Lesson.module.css";

/**
 * The one-line takeaway of a Builder Log day — a short accent rule, the
 * "What I learned" label, then the lesson in display italic.
 *
 *   <Lesson>
 *
 *   If the robot can tell you how wrong it is, use that.
 *
 *   </Lesson>
 */
export default function Lesson({ children }: { children: ReactNode }) {
  return (
    <aside className={styles.lesson}>
      <span className={styles.rule} aria-hidden="true" />
      <p className={styles.label}>What I learned</p>
      <div className={styles.text}>{children}</div>
    </aside>
  );
}
