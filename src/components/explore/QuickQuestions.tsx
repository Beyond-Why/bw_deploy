import Link from "next/link";
import type { ExplorationCardData } from "@/lib/explore";
import { explorationHref } from "./ExplorationCard";
import { TrailCounts } from "./TrailCounts";
import styles from "./QuickQuestions.module.css";

/** Short explorations (under about 12 minutes) as one-line rows on a surface. Shows up to 5. */
export function QuickQuestions({
  items,
}: {
  items: Pick<ExplorationCardData, "slug" | "title" | "minutes" | "summary">[];
}) {
  if (items.length === 0) return null;
  return (
    <ul className={styles.group}>
      {items.slice(0, 5).map((item) => (
        <li key={item.slug}>
          <Link href={explorationHref(item.slug)} className={styles.row}>
            <span className={styles.main}>
              <span className={styles.q}>{item.title}</span>
              <TrailCounts summary={item.summary} className={styles.counts} />
            </span>
            <span className={styles.mins}>{item.minutes} min</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
