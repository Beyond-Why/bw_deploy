import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  label: string;
  /** Trailing count/meta, e.g. "4" or "4 cards" — rendered as "· {meta}". */
  meta?: string | number;
  /** 'section' — Discussion, Keep Exploring, Episodes, Continue Reading,
   *  Recently Saved. 'sub' — one level down, e.g. Physics/Robotics inside
   *  Insight Collections. Defaults to 'section'. */
  level?: "section" | "sub";
  className?: string;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** The one section-heading treatment for the whole product — hub page,
 *  profile page, and anywhere else a list of content needs to announce
 *  itself. Plain heading + optional trailing meta, flush with the left
 *  edge of the content below it. An earlier version prefixed a small
 *  accent bar; removed — it read as decoration competing with the
 *  heading rather than a structural marker, and it knocked the heading
 *  out of alignment with everything under it. */
export function SectionHeading({ label, meta, level = "section", className }: SectionHeadingProps) {
  const Tag = level === "sub" ? "h3" : "h2";

  return (
    <Tag className={cx(styles.heading, level === "sub" && styles.sub, className)}>
      <span className={styles.label}>{label}</span>
      {meta !== undefined && meta !== "" && <span className={styles.meta}>· {meta}</span>}
    </Tag>
  );
}
