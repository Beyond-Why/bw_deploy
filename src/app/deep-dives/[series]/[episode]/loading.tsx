import styles from "./loading.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export default function Loading() {
  return (
    <div className={styles.wrapper} aria-busy="true" aria-label="Loading episode">
      {/* Fake chapter navigator */}
      <div className={styles.chapterNav}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={cx(styles.chapterSegment, styles.shimmer)} />
        ))}
      </div>

      {/* Fake hero image */}
      <div className={cx(styles.hero, styles.shimmer)} />

      {/* Fake series link */}
      <div className={cx(styles.seriesLink, styles.shimmer)} />

      {/* Fake title */}
      <div className={cx(styles.titleLine, styles.titleLineWide, styles.shimmer)} />
      <div className={cx(styles.titleLine, styles.titleLineNarrow, styles.shimmer)} />

      {/* Fake action bar */}
      <div className={styles.actionBar}>
        <span className={cx(styles.actionPill, styles.shimmer)} />
        <span className={cx(styles.actionPill, styles.shimmer)} />
        <span className={cx(styles.actionPill, styles.shimmer)} />
      </div>

      {/* Fake paragraph lines */}
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.paragraph}>
          <div className={cx(styles.line, styles.lineFull, styles.shimmer)} />
          <div className={cx(styles.line, styles.lineWide, styles.shimmer)} />
          <div className={cx(styles.line, styles.lineMed, styles.shimmer)} />
          <div className={cx(styles.line, styles.lineShort, styles.shimmer)} />
        </div>
      ))}
    </div>
  );
}
