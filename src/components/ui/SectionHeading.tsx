import Link from "next/link";
import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  label: string;
  /** Trailing count/meta, e.g. "4" or "4 cards" — rendered as "· {meta}". */
  meta?: string | number;
  /** 'section' — Discussion, Keep Exploring, Episodes, Continue Reading,
   *  Recently Saved. 'sub' — one level down, e.g. Physics/Robotics inside
   *  Insight Collections. 'display' — the v2 home/explore heading: serif
   *  34px (26px on phones) with an optional subtitle and "See all" link
   *  (docs/design/v2/README.md). Defaults to 'section'. */
  level?: "section" | "sub" | "display";
  /** display only: one muted line under the heading. */
  subtitle?: string;
  /** display only: link on the right, e.g. { href: "/explore", label: "See all" }. */
  action?: { href: string; label: string };
  /** display only: id for aria-labelledby on the section. */
  id?: string;
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
export function SectionHeading({
  label,
  meta,
  level = "section",
  subtitle,
  action,
  id,
  className,
}: SectionHeadingProps) {
  if (level === "display") {
    return (
      <div className={cx(styles.display, className)}>
        <div>
          <h2 id={id} className={styles.displayTitle}>
            {label}
          </h2>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        {action && (
          <Link href={action.href} className={styles.action}>
            {action.label}
          </Link>
        )}
      </div>
    );
  }

  const Tag = level === "sub" ? "h3" : "h2";

  return (
    <Tag className={cx(styles.heading, level === "sub" && styles.sub, className)}>
      <span className={styles.label}>{label}</span>
      {meta !== undefined && meta !== "" && <span className={styles.meta}>· {meta}</span>}
    </Tag>
  );
}
