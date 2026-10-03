import type { ReactNode } from "react";
import styles from "./TryThis.module.css";

/** "Do this in your head" instruction to the reader — an accent rule and
 *  a slight indent, otherwise plain body text (no fill, label or icon). */
export default function TryThis({ children }: { children: ReactNode }) {
  return <div className={styles.tryThis}>{children}</div>;
}
