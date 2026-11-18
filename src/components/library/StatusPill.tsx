import styles from "./StatusPill.module.css";

export type SeriesStatus = "in-progress" | "complete" | "planned" | "paused";

/** Deep Dives use series vocabulary; Builder Logs use build vocabulary.
 *  Same underlying status tokens (--status-progress etc.) either way —
 *  only the displayed word differs by kind. */
const DEEPDIVE_LABELS: Record<SeriesStatus, string> = {
  "in-progress": "In Progress",
  complete: "Complete",
  planned: "Planned",
  paused: "Paused",
};

const BUILDERLOG_LABELS: Record<SeriesStatus, string> = {
  "in-progress": "Active Build",
  complete: "Shipped",
  planned: "Planned",
  paused: "Paused",
};

/** v2 builds (docs/design/v2/README.md): sentence-case words, and an
 *  active build reads green (--status-complete), not amber. */
const BUILD_LABELS: Record<SeriesStatus, string> = {
  "in-progress": "Active build",
  complete: "Shipped",
  planned: "Planned",
  paused: "Paused",
};

const BUILD_VARIANT_CLASS: Record<SeriesStatus, string> = {
  "in-progress": styles.pill_complete,
  complete: styles.pill_complete,
  planned: styles.pill_planned,
  paused: styles.pill_paused,
};

const VARIANT_CLASS: Record<SeriesStatus, string> = {
  "in-progress": styles.pill_progress,
  complete: styles.pill_complete,
  planned: styles.pill_planned,
  paused: styles.pill_paused,
};

/** Hairline outline pill — colored text, transparent fill, never a solid chip. */
export function StatusPill({
  status,
  kind = "deepdive",
}: {
  status: SeriesStatus;
  /** "build" is the v2 hairline pill (1px currentColor border, 10.5px). */
  kind?: "deepdive" | "builderlog" | "build";
}) {
  if (kind === "build") {
    return (
      <span className={`${styles.pill} ${styles.pill_v2} ${BUILD_VARIANT_CLASS[status]}`}>
        {BUILD_LABELS[status]}
      </span>
    );
  }
  const labels = kind === "builderlog" ? BUILDERLOG_LABELS : DEEPDIVE_LABELS;
  return <span className={`${styles.pill} ${VARIANT_CLASS[status]}`}>{labels[status]}</span>;
}
