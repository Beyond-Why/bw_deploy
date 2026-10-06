import type { ReactNode } from "react";
import styles from "./Beat.module.css";

/** A short line that lands a point — body size, a touch heavier, with
 *  room above and below. */
export default function Beat({ children }: { children: ReactNode }) {
  return <div className={styles.beat}>{children}</div>;
}
