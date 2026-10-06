import styles from "./Space.module.css";

/** Extra breathing room between paragraph groups (exactly 2em; collapses
 *  with neighbouring margins rather than adding to them). Purely visual. */
export default function Space() {
  return <div className={styles.space} aria-hidden="true" />;
}
