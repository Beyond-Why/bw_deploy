"use client";

import { useRef, Fragment } from "react";
import Link from "next/link";
import { generateCardMotif, MOTIF_VIEWBOX, type MotifType } from "@/lib/cardMotif";
import { StatusPill, type SeriesStatus } from "./StatusPill";
import { NewTag } from "@/components/ui/NewTag";
import styles from "./SeriesCard.module.css";

const PARALLAX_MAX = 7;

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

export type SeriesCardKind = "deepdive" | "insight";

export interface SeriesCardProps {
  kind: SeriesCardKind;
  slug: string;
  href: string;
  title: string;
  /** Always visible for deepdive; hover-revealed teaser for insight. */
  description?: string;
  thumbnail?: string;
  motif?: MotifType;
  scroll?: boolean;

  /** deepdive: "Foundation & Reality". */
  category?: string;

  /** insight only — "01" in collection contexts, the parent collection's name in the mixed context. */
  numberLabel?: string;
  numberAccent?: boolean;

  /** deepdive */
  status?: SeriesStatus;

  /** deepdive */
  episodeCount?: number;
  currentEpisodeNumber?: number;

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
  publishedAt,
  date,
}: SeriesCardProps) {
  const hasThumbnail = Boolean(thumbnail);
  const driftRef = useRef<HTMLDivElement>(null);

  let motif = null;
  if (!hasThumbnail) {
    try {
      motif = generateCardMotif(motifType, slug);
    } catch {
      motif = null;
    }
  }

  // Background-image parallax on mouse move.
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

  const showNumberCorner = Boolean(numberLabel);
  const isInsight = kind === "insight";
  const alwaysShowDescription = !isInsight && Boolean(description);

  const eyebrow =
    kind === "deepdive" && (status || category) ? (
      <div className={styles.eyebrowRow}>
        {status && <StatusPill status={status} kind="deepdive" />}
        {category && (
          <span className={styles.typeLabel}>{category}</span>
        )}
      </div>
    ) : null;

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

      {/* Stroke-number corner overlay. */}
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
