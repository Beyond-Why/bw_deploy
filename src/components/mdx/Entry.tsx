import type { ReactNode } from "react";
import styles from "./Entry.module.css";

/**
 * One timestamped moment in a Builder Log day — the time in a narrow
 * column beside the text (above it, under 700px).
 *
 *   <Entry time="10:20">
 *
 *   Spent the morning just watching numbers.
 *
 *   </Entry>
 */
export default function Entry({ time, children }: { time?: string; children: ReactNode }) {
  return (
    <div className={styles.entry}>
      {time ? <time className={styles.time}>{time}</time> : <span aria-hidden="true" />}
      <div className={styles.text}>{children}</div>
    </div>
  );
}
