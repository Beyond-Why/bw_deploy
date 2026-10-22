import styles from "./LogGlyph.module.css";

/**
 * The marks a log leaves on every Builder Log track — the series page
 * rail, the journey bar, the phone pill and the homepage road.
 *
 *   <LogGlyph kind="dot" />                  an ordinary log
 *   <LogGlyph kind="spark" />                a breakthrough
 *   <LogGlyph kind="diamond" />              a milestone
 *   <LogGlyph kind="ring" />                 "still going" — hollow, gently pulsing
 *   <LogGlyph kind="dot" state="future" />   a log after the current one
 *
 * Decorative: always aria-hidden, the text next to it carries the meaning.
 */

export type LogGlyphKind = "dot" | "spark" | "diamond" | "ring";

/** The glyph for a log's highlight. */
export function glyphForHighlight(highlight?: "breakthrough" | "milestone"): LogGlyphKind {
  if (highlight === "breakthrough") return "spark";
  if (highlight === "milestone") return "diamond";
  return "dot";
}

export default function LogGlyph({
  kind,
  size = 14,
  state = "past",
  className,
}: {
  kind: LogGlyphKind;
  size?: number;
  /** Where the log sits relative to the one being read. */
  state?: "past" | "current" | "future";
  className?: string;
}) {
  const classes = [styles.glyph, styles[kind], styles[state], className].filter(Boolean).join(" ");
  return (
    <svg
      className={classes}
      width={size}
      height={size}
      viewBox="0 0 14 14"
      aria-hidden="true"
      focusable="false"
    >
      {kind === "dot" && <circle cx="7" cy="7" r="2.5" />}
      {kind === "spark" && (
        <path d="M7 0.8 L8.15 5.85 L13.2 7 L8.15 8.15 L7 13.2 L5.85 8.15 L0.8 7 L5.85 5.85 Z" />
      )}
      {kind === "diamond" && <path d="M7 2 L12 7 L7 12 L2 7 Z" />}
      {kind === "ring" && <circle cx="7" cy="7" r="5" />}
    </svg>
  );
}
