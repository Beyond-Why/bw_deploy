import type { ReactNode } from "react";
import styles from "./PullQuote.module.css";

/** Centred display-serif pull line. Deliberately not a <blockquote>, so
 *  it never picks up the default blockquote rule. */
export default function PullQuote({ children }: { children: ReactNode }) {
  return <div className={styles.pullQuote}>{children}</div>;
}
