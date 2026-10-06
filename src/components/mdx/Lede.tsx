import type { ReactNode } from "react";
import styles from "./Lede.module.css";

/** Opening line of an episode — a step above body size, otherwise plain. */
export default function Lede({ children }: { children: ReactNode }) {
  return <div className={styles.lede}>{children}</div>;
}
