import Link from "next/link";
import type { InsightCardFrontmatter } from "@/lib/content";
import { generateCardMotif, MOTIF_VIEWBOX, type MotifType } from "@/lib/cardMotif";
import styles from "./InsightSquareCard.module.css";

interface InsightSquareCardProps {
  slug: string;
  frontmatter: InsightCardFrontmatter;
  href: string;
  /** "01" — the card's position within the active collection. */
  position: string;
  motif?: MotifType;
  /** Shows the accent ring + "Reading" pill — the card currently open in the reader block. */
  active?: boolean;
  scroll?: boolean;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function InsightSquareCard({
  slug,
  frontmatter,
  href,
  position,
  motif: motifType = "radial",
  active = false,
  scroll,
}: InsightSquareCardProps) {
  const hasThumbnail = Boolean(frontmatter.thumbnail);

  // Tier 2 fallback — only needed when there's no real thumbnail to show.
  let motif = null;
  if (!hasThumbnail) {
    try {
      motif = generateCardMotif(motifType, slug);
    } catch {
      motif = null;
    }
  }

  return (
    <Link href={href} scroll={scroll} className={cx(styles.card, active && styles.active)}>
      {/* Visual layer — thumbnail when set, else the generative motif, both
          faded by a downward mask (faint top, stronger bottom) plus a
          static scrim for title legibility. Clipped to the rounded
          corners in its own layer so .card itself stays unclipped — the
          bleeding corner number below depends on that. */}
      <div className={styles.mediaClip} aria-hidden="true">
        {hasThumbnail ? (
          <img src={frontmatter.thumbnail} alt="" className={styles.thumbImage} />
        ) : (
          motif && (
            <svg className={styles.motif} viewBox={MOTIF_VIEWBOX} preserveAspectRatio="none">
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
        <div className={styles.scrim} />
      </div>

      <span className={styles.number}>{position}</span>
      {active && <span className={styles.readingPill}>Reading</span>}
      <h3 className={styles.question}>{frontmatter.title}</h3>
    </Link>
  );
}
