import type { ReactNode } from "react";
import styles from "./BigQuestion.module.css";

/** The one pivotal question of an episode — set apart by size and
 *  spacing alone, left-aligned with the text column. */
export default function BigQuestion({ children }: { children: ReactNode }) {
  return <p className={styles.bigQuestion}>{children}</p>;
}
