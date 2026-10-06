import type { ReactNode } from "react";
import styles from "./Step.module.css";

/** A numbered reader instruction — "STEP n" label beside the text,
 *  ruled top and bottom. `n` is printed as given (no zero padding). */
export default function Step({ n, children }: { n: number | string; children: ReactNode }) {
  return (
    <div className={styles.step}>
      <span className={styles.label}>Step {n}</span>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
