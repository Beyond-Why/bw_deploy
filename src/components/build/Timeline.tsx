import Link from "next/link";
import { Icon } from "@/components/icons/Icon";
import type { BuildLog, Highlight, Milestone, TimelineState } from "@/lib/build";
import { buildNumber } from "@/lib/build";
import { formatDayMonth } from "@/lib/dates";
import styles from "./Timeline.module.css";

export interface TimelineEntry {
  key: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  state: TimelineState;
  highlight?: Highlight;
  href?: string;
  notes?: { expected?: string; happened?: string; broke?: string };
}

export function milestonesToEntries(milestones: Milestone[]): TimelineEntry[] {
  return milestones.map((m) => ({
    key: `${m.date}-${m.title}`,
    date: m.date,
    title: m.title,
    state: m.state,
    highlight: m.highlight,
    href: m.href,
  }));
}

export function logsToEntries(logs: BuildLog[]): TimelineEntry[] {
  return logs.map((l) => ({
    key: l.slug,
    date: l.date,
    title: `Log ${buildNumber(l.n)} · ${l.title}`,
    state: l.state,
    highlight: l.highlight,
    href: l.href,
    notes: {
      expected: l.state === "done" ? undefined : l.expected,
      happened: l.happened,
      broke: l.broke,
    },
  }));
}

const HIGHLIGHT_WORD: Record<Highlight, string> = { breakthrough: "Breakthrough", milestone: "Milestone" };

function dateLabel(e: TimelineEntry, withHighlight: boolean): string {
  const day = formatDayMonth(e.date);
  if (e.state === "next") return `Next · ${day}`;
  if (e.state === "planned") return `Planned · ${day}`;
  return withHighlight && e.highlight ? `${day} · ${HIGHLIGHT_WORD[e.highlight]}` : day;
}

const STATE_WORD: Record<TimelineState, string> = { done: "done", next: "next", planned: "planned" };

function Mark({ entry }: { entry: TimelineEntry }) {
  const important = entry.state === "done" && entry.highlight;
  return (
    <span className={`${styles.mark} ${important ? styles.star : ""}`} aria-hidden="true">
      {important ? (
        <Icon name="mark-star" size={20} />
      ) : (
        <span className={styles[`c_${entry.state}`]} />
      )}
    </span>
  );
}

function srStatus(e: TimelineEntry) {
  const word = e.state === "done" && e.highlight ? HIGHLIGHT_WORD[e.highlight].toLowerCase() : STATE_WORD[e.state];
  return <span className="visually-hidden">({word}) </span>;
}

interface TimelineProps {
  /** In date order, oldest first. */
  entries: TimelineEntry[];
  /** across: build banner and build page header (4–5 points).
   *  down: build logs, with notes; newest first by default. */
  direction?: "across" | "down";
  order?: "newest-first" | "oldest-first";
  /** down only: titles without notes, for the phone build banner. */
  compact?: boolean;
  label?: string;
}

/** Build milestones and logs. Circle for each entry; a star only for
 *  `highlight`; a blue ring for the next one; a hollow ring for planned.
 *  The line is solid up to today and dashed after. The marks sit on
 *  var(--timeline-bg), which the parent sets to its own background. */
export function Timeline({
  entries,
  direction = "across",
  order = "newest-first",
  compact = false,
  label = "Milestones",
}: TimelineProps) {
  if (direction === "across") {
    const shown = entries.slice(0, 5);
    const firstFuture = shown.findIndex((e) => e.state !== "done");
    const done = Math.round(((firstFuture === -1 ? shown.length : firstFuture) / shown.length) * 100);
    return (
      <ol
        className={styles.track}
        style={{ "--done": `${done}%`, "--cols": shown.length } as React.CSSProperties}
        aria-label={label}
      >
        {shown.map((e) => {
          const body = (
            <>
              <Mark entry={e} />
              <span className={styles.date}>{dateLabel(e, true)}</span>
              <span className={styles.title}>
                {srStatus(e)}
                {e.title}
              </span>
            </>
          );
          return (
            <li key={e.key} className={`${styles.node} ${styles[e.state]} ${e.highlight && e.state === "done" ? styles.imp : ""}`}>
              {e.href ? (
                <Link href={e.href} className={styles.nodeLink}>
                  {body}
                </Link>
              ) : (
                <div className={styles.nodeLink}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  const rows = order === "newest-first" ? [...entries].reverse() : entries;
  return (
    <ol className={`${styles.down} ${compact ? styles.compact : ""}`} aria-label={label}>
      {rows.map((e, i) => {
        // The rail below a row joins it to the next row down; it is dashed
        // when that stretch of time is still to come.
        const below = rows[i + 1];
        const future = below ? (order === "newest-first" ? e.state !== "done" : below.state !== "done") : false;
        const title = (
          <span className={styles.rowTitle}>
            {srStatus(e)}
            {e.title}
          </span>
        );
        return (
          <li
            key={e.key}
            className={`${styles.row} ${styles[e.state]} ${future ? styles.fut : ""} ${e.highlight && e.state === "done" ? styles.imp : ""}`}
          >
            {/* Down shows the date alone (as in the mock-up); the mark and the
                screen-reader word carry the state. */}
            <span className={styles.rowDate}>{formatDayMonth(e.date)}</span>
            <span className={styles.rail}>
              <Mark entry={e} />
            </span>
            <div className={styles.body}>
              {e.href ? (
                <Link href={e.href} className={styles.rowLink}>
                  {title}
                </Link>
              ) : (
                title
              )}
              {!compact && e.notes?.expected && (
                <span className={styles.note}>
                  <b>Expected</b>
                  {e.notes.expected}
                </span>
              )}
              {!compact && e.notes?.happened && (
                <span className={styles.note}>
                  <b>Happened</b>
                  {e.notes.happened}
                </span>
              )}
              {!compact && e.notes?.broke && (
                <span className={styles.note}>
                  <b>Broke</b>
                  {e.notes.broke}
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
