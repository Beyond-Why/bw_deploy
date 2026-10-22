import type { ReactNode } from "react";
import type { BuilderLogBodySummary, BuilderLogEntry } from "@/lib/content";
import LogGlyph, { glyphForHighlight } from "./LogGlyph";
import LogCover from "./LogCover";
import LogFold from "./LogFold";
import LogActions from "./LogActions";
import { LogFoldScope } from "./logState";
import styles from "./LogEntry.module.css";

/**
 * One Builder Log day: the sticky rail (glyph on the line, "Day", the
 * outlined numeral, date, "Latest" chip, highlight label) beside the main
 * column (title, cover, MDX body, actions). Used by the series feed and,
 * on its own, by the single-log share page.
 *
 *   <LogEntry series="line-follower" log={log} body={<MDXRemote … />}
 *             isLatest current />
 */
export default function LogEntry({
  series,
  log,
  body,
  isLatest = false,
  current = false,
  priority = false,
  headingLevel = 2,
}: {
  series: string;
  log: BuilderLogEntry;
  /** The log's MDX, already rendered on the server. */
  body: ReactNode;
  isLatest?: boolean;
  /** The log being read — its numeral gets the accent stroke. */
  current?: boolean;
  /** Load the cover eagerly (the first log on the page). */
  priority?: boolean;
  /** h1 on the share page, h2 in the series feed. */
  headingLevel?: 1 | 2;
}) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const glyph = glyphForHighlight(log.highlight);

  return (
    <section id={`day-${log.day}`} data-day={log.day} className={styles.log} aria-labelledby={`day-${log.day}-title`}>
      <LogFoldScope day={log.day} likelyTall={isLikelyTall(log)}>
        <div className={styles.rail}>
          <div className={styles.railInner}>
            <LogGlyph kind={glyph} state={current ? "current" : "past"} className={styles.node} />
            <span className={styles.dayLabel}>Day</span>
            <span className={`${styles.numeral} ${current ? styles.numeralCurrent : ""}`}>{log.day}</span>
            {log.date && (
              <time className={styles.date} dateTime={log.date}>
                {log.dateLabel}
              </time>
            )}
            {isLatest && <span className={styles.latest}>Latest</span>}
            {log.highlight && (
              <span className={`${styles.highlight} ${styles[log.highlight]}`}>
                <LogGlyph kind={glyph} size={12} />
                {log.highlight === "breakthrough" ? "Breakthrough" : "Milestone"}
              </span>
            )}
          </div>
        </div>

        <div className={styles.main}>
          <Heading id={`day-${log.day}-title`} className={styles.title}>
            {log.title}
          </Heading>
          <LogCover
            thumbnail={log.thumbnail}
            thumbnailAlt={log.thumbnailAlt}
            video={log.video}
            videoLength={log.videoLength}
            title={log.title}
            priority={priority}
          />
          <div className={styles.body}>
            <LogFold hint={foldHint(log.summary)}>{body}</LogFold>
          </div>
          <LogActions series={series} slug={log.slug} day={log.day} />
        </div>
      </LogFoldScope>
    </section>
  );
}

/** Server-side guess at whether the body will pass the fold limit, so a
 *  log that will fold renders folded from the first paint. The client
 *  measures and corrects it either way. */
function isLikelyTall(log: BuilderLogEntry): boolean {
  const { entries, photos, diagrams, toggles } = log.summary;
  return entries >= 2 && photos + diagrams + toggles > 0;
}

function plural(count: number, one: string, many: string) {
  return count === 1 ? one : `${count} ${many}`;
}

/** "Inside: 3 photos and a look under the hood" — what a folded log hides. */
export function foldHint({ photos, diagrams, toggles }: BuilderLogBodySummary): string | undefined {
  const parts = [
    photos > 0 && plural(photos, "a photo", "photos"),
    diagrams > 0 && plural(diagrams, "a diagram", "diagrams"),
    toggles > 0 && (toggles === 1 ? "a look under the hood" : `${toggles} looks under the hood`),
  ].filter((part): part is string => !!part);
  if (parts.length === 0) return undefined;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `Inside: ${list}`;
}
