import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getBuilderLog, type BuilderLogEntry } from "@/lib/content";
import { publicFileExists } from "@/lib/publicAsset";
import { BuilderLogIcon } from "@/components/icons";
import LogGlyph, { glyphForHighlight } from "@/components/builder-log/LogGlyph";
import { StatusPill } from "./StatusPill";
import styles from "./BuilderLogBanner.module.css";

/** Tilts for the hanging cards, oldest → newest. */
const CARD_TILTS = [-1.8, 1.3, -0.9];
const MAX_CARDS = 3;
/** The road runs from the left edge to this share of its width; the
 *  dashed "still going" tail fills the rest. */
const ROAD_SPAN = 80;

/**
 * A Builder Log series in the home feed / Library (and, compact, the Deep
 * Dive reader's Explore sidebar): the series text, a "road" with one node
 * per log and the latest highlights hanging off it, and the newest log's
 * line as a quote.
 *
 * One markup, laid out by container queries on the banner's own width —
 * desktop (≥1040px), tablet (660–1039px), phone (<660px) — so it fits
 * whatever column it's in. `variant="compact"` always uses the phone
 * layout and sits flat (no padding, texture or glow) for the sidebar.
 *
 *   <BuilderLogBanner series="line-follower" />
 */
export default async function BuilderLogBanner({
  series,
  variant = "full",
}: {
  series: string;
  variant?: "full" | "compact";
}) {
  const log = await getBuilderLog(series);
  if (!log || log.count === 0) return null;

  const { frontmatter, logs } = log;
  const first = logs[0];
  const newest = logs[logs.length - 1];
  const seriesHref = `/builder-log/${series}`;
  const dayHref = (day: number) => `${seriesHref}#day-${day}`;
  const startHref = `${seriesHref}?order=oldest`;
  const position = (index: number) => (logs.length > 1 ? (index / (logs.length - 1)) * ROAD_SPAN : 0);

  // The latest highlights hang off the road, oldest → newest.
  const highlighted = logs
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => entry.highlight)
    .slice(-MAX_CARDS);
  const cards = await Promise.all(
    highlighted.map(async ({ entry, index }) => ({
      entry,
      index,
      hasCover: entry.thumbnail ? await publicFileExists(entry.thumbnail) : false,
    }))
  );

  const titleId = `builder-log-${series}-title`;
  const quoteText = newest.excerpt || newest.title;

  const startLink = (className: string) => (
    <Link href={startHref} className={`${styles.start} ${className}`}>
      <span className={styles.circle} aria-hidden="true">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5v14" />
          <path d="m18 6-8 6 8 6z" fill="currentColor" />
        </svg>
      </span>
      Start from Day 1
    </Link>
  );

  return (
    <section
      className={`${styles.banner} ${variant === "compact" ? styles.compact : ""}`}
      aria-labelledby={titleId}
    >
      <div className={styles.inner}>
        <div className={styles.text}>
          <div className={styles.kindRow}>
            <span className={styles.kind}>
              <BuilderLogIcon size={15} />
              Builder Log
            </span>
            {frontmatter.status && <StatusPill status={frontmatter.status} kind="builderlog" />}
          </div>
          <h2 id={titleId} className={styles.title}>
            <Link href={seriesHref}>{frontmatter.title}</Link>
          </h2>
          {frontmatter.description && <p className={styles.premise}>{frontmatter.description}</p>}
          {startLink(styles.startTablet)}
        </div>

        <div className={styles.stage}>
          <div className={styles.quote}>
            <p className={styles.latestLine}>
              <span className={styles.latest}>Latest</span> Day {newest.day}, {newest.dateLabel}
            </p>
            <blockquote className={styles.excerpt}>
              {newest.excerpt ? <>&ldquo;{quoteText}&rdquo;</> : quoteText}
            </blockquote>
            {newest.excerpt && (
              <Link href={dayHref(newest.day)} className={styles.logTitle}>
                {newest.title}
              </Link>
            )}
            <div className={styles.quoteActions}>
              <Link href={dayHref(newest.day)} className={styles.read}>
                <span className={`${styles.circle} ${styles.circleAccent}`} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
                Read Day {newest.day}
              </Link>
              {startLink(styles.startPhone)}
            </div>
          </div>

          <div className={styles.scroller}>
            <div className={styles.road}>
              <div className={styles.track}>
                <span className={styles.glow} style={{ left: `${position(logs.length - 1)}%` }} aria-hidden="true" />
                <span className={styles.line} style={{ width: `${position(logs.length - 1)}%` }} aria-hidden="true" />
                <span className={styles.tail} style={{ left: `${position(logs.length - 1)}%` }} aria-hidden="true" />

                {logs.map((entry, index) =>
                  entry === newest ? (
                    <span key={entry.day} className={styles.newestNode} style={{ left: `${position(index)}%` }} aria-hidden="true" />
                  ) : (
                    <span key={entry.day} className={styles.node} style={{ left: `${position(index)}%` }} aria-hidden="true">
                      <LogGlyph kind={glyphForHighlight(entry.highlight)} />
                    </span>
                  )
                )}

                <span className={styles.ring} style={{ left: `calc(${position(logs.length - 1)}% + 34px)` }} aria-hidden="true">
                  <LogGlyph kind="ring" size={16} />
                </span>
                <span className={styles.nextLog} style={{ left: `calc(${position(logs.length - 1)}% + 18px)` }}>
                  The next log isn&apos;t written yet
                </span>

                <div className={styles.dayOne}>
                  <span className={styles.dayOneLabel}>
                    <strong>Day {first.day}</strong> {first.dateLabel}
                  </span>
                  {startLink(styles.startDesktop)}
                </div>

                {cards.map(({ entry, index, hasCover }, cardIndex) => (
                  <HangingCard
                    key={entry.day}
                    entry={entry}
                    href={dayHref(entry.day)}
                    left={position(index)}
                    tilt={CARD_TILTS[cardIndex % CARD_TILTS.length]}
                    hasCover={hasCover}
                    middle={cards.length === 3 && cardIndex === 1}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className={styles.swipeHint}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            Swipe back to Day 1
          </p>
        </div>
      </div>
    </section>
  );
}

function HangingCard({
  entry,
  href,
  left,
  tilt,
  hasCover,
  middle,
}: {
  entry: BuilderLogEntry;
  href: string;
  left: number;
  tilt: number;
  hasCover: boolean;
  /** The middle of three — hidden on the tablet layout. */
  middle: boolean;
}) {
  return (
    <Link
      href={href}
      className={`${styles.card} ${middle ? styles.cardMiddle : ""}`}
      style={{ left: `${left}%`, "--tilt": `${tilt}deg` } as CSSProperties}
      aria-label={`Day ${entry.day}: ${entry.title}`}
    >
      <span className={styles.frame}>
        {entry.thumbnail && hasCover ? (
          <Image src={entry.thumbnail} alt="" fill sizes="(max-width: 699px) 124px, 150px" className={styles.cover} />
        ) : (
          <span className={styles.coverPlaceholder} />
        )}
        {entry.video && entry.videoLength && <span className={styles.length}>{entry.videoLength}</span>}
      </span>
      <span className={styles.caption} aria-hidden="true">
        <span className={styles.captionDay}>Day {entry.day}</span>
        <span className={styles.captionTitle}>{entry.title}</span>
      </span>
    </Link>
  );
}
