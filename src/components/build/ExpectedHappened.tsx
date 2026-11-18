import styles from "./ExpectedHappened.module.css";

/** The latest log as two halves: "What I expected" | "What happened". Stacked on phones. */
export function ExpectedHappened({
  expected,
  happened,
  note,
}: {
  expected: string;
  happened?: string;
  note?: string;
}) {
  return (
    <div className={styles.split}>
      <div className={styles.expected}>
        <span className={styles.label}>What I expected</span>
        <p className={styles.text}>{expected}</p>
      </div>
      <div className={styles.happened}>
        <span className={`${styles.label} ${styles.accent}`}>What happened</span>
        <p className={styles.text}>{happened ?? "Not logged yet."}</p>
        {note && <p className={styles.note}>{note}</p>}
      </div>
    </div>
  );
}
