import type { ReactNode } from "react";
import styles from "./Closer.module.css";

/** Episode's final line — a short centred rule, then quiet italic text. */
export default function Closer({ children }: { children: ReactNode }) {
  return (
    <div className={styles.closer}>
      <hr className={styles.rule} />
      <div className={styles.text}>{children}</div>
    </div>
  );
}
