import Link from "next/link";
import styles from "./EmptyState.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface EmptyStateProps {
  icon: React.ReactNode;
  message: string;
  /** Second, more subdued line — only the Home tab's all-empty state uses this. */
  subMessage?: string;
  ctaLabel: string;
  ctaHref: string;
  /** "default" = Home tab all-empty (80px top margin, 16px gaps, two-tone
   *  text). "compact" = per-type tab empty states (60px, 12px gaps, single
   *  muted line). "section" = a single section's empty state sitting
   *  directly beneath its own heading, inside an otherwise-populated page
   *  (e.g. Recently Saved or Recent Comments when only one of the two is
   *  empty) — same two-tone text as "default" but a smaller top margin
   *  since a heading already sits right above it. */
  variant?: "default" | "compact" | "section";
}

/** Quiet, centered empty state — no box, no border. Shared by the Home
 *  tab's all-sections-empty state and the per-type tabs' empty states. */
export function EmptyState({
  icon,
  message,
  subMessage,
  ctaLabel,
  ctaHref,
  variant = "default",
}: EmptyStateProps) {
  return (
    <div className={cx(styles.wrapper, styles[variant])}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      {subMessage ? (
        <div className={styles.textBlock}>
          <p className={styles.message}>{message}</p>
          <p className={styles.subMessage}>{subMessage}</p>
        </div>
      ) : (
        <p className={styles.compactMessage}>{message}</p>
      )}
      <Link href={ctaHref} className={styles.cta}>
        {ctaLabel}
      </Link>
    </div>
  );
}
