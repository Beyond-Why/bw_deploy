"use client";

import { useRef, Fragment } from "react";
import Link from "next/link";
import { generateCardMotif, MOTIF_VIEWBOX, type MotifType } from "@/lib/cardMotif";
import { StatusPill, type SeriesStatus } from "./StatusPill";
import { NewTag } from "@/components/ui/NewTag";
import styles from "./SeriesCard.module.css";

const PARALLAX_MAX = 7;
const RAIL_MAX_SHOWN = 3;

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * -webkit-line-clamp truncates at whatever character its clip box lands
 * on, mid-word included — overflow-wrap/word-break don't stop it, because
 * the cut happens after normal layout, not during it. Wrapping each word
 * in its own non-breaking span (with the space between them left as a
 * plain text node, still a valid break point) forces a word that doesn't
 * fit to move to the next line whole, so the clamp's cut always lands
 * between words instead of inside one.
 */
function WordSafeText({ text }: { text: string }) {
  const words = text.split(" ").filter(Boolean);
  return (
    <>
      {words.map((word, i) => (
        <Fragment key={i}>
          <span style={{ whiteSpace: "nowrap" }}>{word}</span>
          {i < words.length - 1 ? " " : ""}
        </Fragment>
      ))}
    </>
  );
}

/**
 * For a single-line clamp specifically, the word-span trick above doesn't
 * help — -webkit-line-clamp: 1 truncates at the pixel/character level
 * regardless of element boundaries (there's no "next line" for an
 * overflowing word to move to whole, unlike the 2-line case). So this
 * truncates the STRING itself at the last full word within maxChars,
 * before it ever reaches CSS — the ellipsis is already word-safe by the
 * time any clamping could apply.
 */
function truncateAtWord(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  const safe = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${safe}…`;
}

/**
 * A log title, rendered two ways at once (CSS picks one via container
 * query — see .railTitleWide/.railTitleNarrow and their featured-block
 * counterparts): word-safe 2-line wrap at full width, word-safe
 * single-line character clamp in narrow renders (Explore sidebar,
 * mobile), where a 2-line wrap would push the card too tall.
 */
function ClampedLogTitle({
  text,
  wideClass,
  narrowClass,
}: {
  text: string;
  wideClass: string;
  narrowClass: string;
}) {
  return (
    <>
      <span className={wideClass}>
        <WordSafeText text={text} />
      </span>
      <span className={narrowClass}>{truncateAtWord(text, 32)}</span>
    </>
  );
}

export type SeriesCardKind = "deepdive" | "builderlog" | "insight";

export interface SeriesCardLogEntry {
  slug: string;
  num: number;
  title: string;
  date?: string;
  /** Only read for the newest log, which the card features above the rail. */
  excerpt?: string;
  thumbnail?: string;
}

export interface SeriesCardProps {
  kind: SeriesCardKind;
  slug: string;
  href: string;
  title: string;
  /** Always visible for deepdive/builderlog; hover-revealed teaser for insight. */
  description?: string;
  thumbnail?: string;
  motif?: MotifType;
  scroll?: boolean;

  /** deepdive: "Foundation & Reality". builderlog: "Robotics" (rendered "Builder Log · Robotics"). */
  category?: string;

  /** insight only — "01" in collection contexts, the parent collection's name in the mixed context. */
  numberLabel?: string;
  numberAccent?: boolean;

  /** deepdive + builderlog */
  status?: SeriesStatus;

  /** deepdive */
  episodeCount?: number;
  currentEpisodeNumber?: number;

  /** builderlog — newest-first, the FULL list (not pre-sliced). The newest
   *  is featured above the rail; the rail carries the rest and derives its
   *  own "N earlier" count from what it actually rendered. */
  logs?: SeriesCardLogEntry[];

  /** deepdive/insight — drives the NewTag corner badge (shelf/library cards only). */
  publishedAt?: string;
  date?: string;
}

export function SeriesCard({
  kind,
  slug,
  href,
  title,
  description,
  thumbnail,
  motif: motifType = "radial",
  scroll,
  category,
  numberLabel,
  numberAccent = false,
  status,
  episodeCount,
  currentEpisodeNumber,
  logs = [],
  publishedAt,
  date,
}: SeriesCardProps) {
  const isBuilderLog = kind === "builderlog";
  const hasThumbnail = Boolean(thumbnail) && !isBuilderLog;
  const driftRef = useRef<HTMLDivElement>(null);

  // builderlog never carries a background or motif — plain at rest, the
  // surface only ever fades in on hover (stage one).
  let motif = null;
  if (!hasThumbnail && !isBuilderLog) {
    try {
      motif = generateCardMotif(motifType, slug);
    } catch {
      motif = null;
    }
  }

  // Background-image parallax on mouse move — deepdive/insight only
  // (driftRef.current is null for builderlog, which renders no visual
  // layer, so this is a harmless no-op there).
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!driftRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    const dx = -relX * PARALLAX_MAX * 2;
    const dy = -relY * PARALLAX_MAX * 2;
    driftRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
  };

  const handleMouseLeave = () => {
    if (driftRef.current) driftRef.current.style.transform = "";
  };

  const showNumberCorner = kind !== "builderlog" && Boolean(numberLabel);
  const isInsight = kind === "insight";
  const alwaysShowDescription = !isInsight && Boolean(description);

  const eyebrow =
    (kind === "builderlog" || kind === "deepdive") && (status || category) ? (
      <div className={styles.eyebrowRow}>
        {status && <StatusPill status={status} kind={kind === "builderlog" ? "builderlog" : "deepdive"} />}
        {kind === "builderlog" && (
          <span className={styles.typeLabel}>
            Builder Log{category ? ` · ${category}` : ""}
          </span>
        )}
        {kind === "deepdive" && category && (
          <span className={styles.typeLabel}>{category}</span>
        )}
      </div>
    ) : null;

  // ── Builder log: a <div> wrapper, not a whole-card <a> — the featured
  // block and rail entries are each their own link, and nested anchors
  // are invalid HTML. The title uses the stretched-link pattern instead:
  // its own link, with an ::after covering the card so clicking anywhere
  // else still navigates to the series page. The featured block and rail
  // entries sit above that overlay (z-index) to capture their own clicks.
  // Hover is pure CSS (:hover/:focus-within, see .builderlog in the CSS) —
  // no JS timers, nothing to cancel, nothing to coordinate across cards. ──
  if (isBuilderLog) {
    const [featured, ...rest] = logs;
    return (
      <div className={cx(styles.card, styles.builderlog)}>
        <div className={styles.body}>
          {eyebrow}

          <Link href={href} scroll={scroll} className={styles.titleLink}>
            <h3 className={styles.title}>
              <WordSafeText text={title} />
            </h3>
          </Link>

          {alwaysShowDescription && (
            <p className={styles.description}>
              <WordSafeText text={description ?? ""} />
            </p>
          )}

          {featured && <FeaturedLog log={featured} seriesSlug={slug} />}
          {rest.length > 0 && <RailStrip logs={rest} seriesSlug={slug} />}
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      scroll={scroll}
      className={styles.card}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Visual layer — thumbnail when set, else the generative motif, both
          faded by a downward mask plus a static scrim for title legibility.
          Clipped to the rounded corners in its own layer so .card itself
          stays unclipped (the bleeding corner number depends on that). */}
      <div className={styles.visualClip} aria-hidden="true">
        <div className={styles.visualDrift} ref={driftRef}>
          {hasThumbnail ? (
            <img src={thumbnail} alt="" className={styles.thumbImage} />
          ) : (
            motif && (
              <svg
                className={styles.motif}
                viewBox={MOTIF_VIEWBOX}
                preserveAspectRatio="xMidYMid slice"
              >
                {motif.paths.map((p, i) => (
                  <path key={`p-${i}`} d={p.d} className={styles.motifStroke} />
                ))}
                {motif.lines.map((l, i) => (
                  <line
                    key={`l-${i}`}
                    x1={l.x1}
                    y1={l.y1}
                    x2={l.x2}
                    y2={l.y2}
                    className={styles.motifStroke}
                  />
                ))}
                {motif.circles.map((c, i) => (
                  <circle
                    key={`c-${i}`}
                    cx={c.cx}
                    cy={c.cy}
                    r={c.r}
                    className={c.filled ? styles.motifFill : styles.motifStroke}
                  />
                ))}
              </svg>
            )
          )}
        </div>
        <div className={styles.scrim} />
      </div>

      {/* Stroke-number corner overlay — insight and deepdive only. A builder
          log in a shelf isn't the first of anything, so it's omitted there. */}
      {showNumberCorner && (
        <span className={numberAccent ? styles.numberAccent : styles.numberCorner}>
          {numberLabel}
        </span>
      )}

      <span className={styles.newTagCorner}>
        <NewTag publishedAt={publishedAt} date={date} />
      </span>

      <div className={styles.body}>
        {eyebrow}

        <h3 className={styles.title}>
          <WordSafeText text={title} />
        </h3>

        {alwaysShowDescription && (
          <p className={styles.description}>
            <WordSafeText text={description ?? ""} />
          </p>
        )}

        {kind === "deepdive" && episodeCount !== undefined && episodeCount > 0 && (
          <DeepDiveMeter total={episodeCount} current={currentEpisodeNumber} />
        )}

        {/* Hover/focus reveal — insight only, rest state shows just the
            number + question, matching the original insight-bar behavior. */}
        {isInsight && (
          <div className={styles.reveal}>
            <div className={styles.revealInner}>
              {description && <p className={styles.teaser}>{description}</p>}
              <span className={styles.readMore}>Read →</span>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

/**
 * The newest log, featured above the rail — its own link (stretched-link
 * z-index pattern, same as a rail column) so it navigates to that log
 * specifically rather than the series. The thumbnail slot only exists
 * when the log has one; there's no placeholder, motif, or fallback
 * graphic for a missing image, so the excerpt just runs full width.
 */
function FeaturedLog({ log, seriesSlug }: { log: SeriesCardLogEntry; seriesSlug: string }) {
  return (
    <Link href={`/builder-log/${seriesSlug}/${log.slug}`} className={styles.featured}>
      {log.thumbnail && (
        <div className={styles.featuredThumb}>
          <img src={log.thumbnail} alt="" className={styles.featuredThumbImg} />
        </div>
      )}
      <div className={styles.featuredBody}>
        <span className={styles.featuredMeta}>
          LOG {String(log.num).padStart(2, "0")}
          {log.date ? ` · ${log.date}` : ""} · LATEST
        </span>
        <h4 className={styles.featuredTitle}>
          <ClampedLogTitle
            text={log.title}
            wideClass={styles.featuredTitleWide}
            narrowClass={styles.featuredTitleNarrow}
          />
        </h4>
        {log.excerpt && (
          <p className={styles.featuredExcerpt}>
            <WordSafeText text={log.excerpt} />
          </p>
        )}
      </div>
    </Link>
  );
}

/**
 * Reverse-chronological rail: the (already-featured newest log aside)
 * remaining logs, newest-first left to right. Nodes and labels come from
 * ONE loop over the same displayed-logs array, each pair living inside
 * the same grid column — so they can never drift out of alignment or
 * disagree on count the way two independently derived lists could. Every
 * entry renders at the same weight/opacity (the newest-of-all is featured
 * above, not here); the rail line and terminal "N earlier" affordance are
 * the only things that fade, in the final segment only.
 */
function RailStrip({ logs, seriesSlug }: { logs: SeriesCardLogEntry[]; seriesSlug: string }) {
  const shown = logs.slice(0, RAIL_MAX_SHOWN);
  const earlierCount = logs.length - shown.length;
  const hasMore = earlierCount > 0;
  const totalColumns = shown.length + (hasMore ? 1 : 0);
  const fadeStart = hasMore ? `${(shown.length / totalColumns) * 100}%` : "100%";

  return (
    <div className={styles.rail}>
      <div
        className={styles.railLine}
        aria-hidden="true"
        style={{ "--rail-fade-start": fadeStart } as React.CSSProperties}
      />
      <div className={styles.railGrid}>
        {shown.map((log) => (
          <Link
            key={log.slug}
            href={`/builder-log/${seriesSlug}/${log.slug}`}
            className={styles.railColumn}
          >
            <span className={styles.railNode} />
            <span className={styles.railMeta}>
              LOG {String(log.num).padStart(2, "0")}
              {log.date ? ` · ${log.date}` : ""}
            </span>
            <span className={styles.railTitle}>
              <ClampedLogTitle
                text={log.title}
                wideClass={styles.railTitleWide}
                narrowClass={styles.railTitleNarrow}
              />
            </span>
          </Link>
        ))}

        {hasMore && (
          <div className={styles.railColumn}>
            <span className={cx(styles.railNode, styles.railNodeTerminal)} />
            <span className={styles.railEarlier}>
              {earlierCount} earlier log{earlierCount !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Segmented episode meter — same visual language as EpisodeReader's chapter navigator. */
function DeepDiveMeter({ total, current }: { total: number; current?: number }) {
  const cur = current ?? 0;
  return (
    <div className={styles.meterRow}>
      <div className={styles.meterSegments} aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={cx(styles.meterSegment, i < cur && styles.meterSegmentDone)} />
        ))}
      </div>
      <span className={styles.meterCount}>
        {String(cur).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>
    </div>
  );
}
