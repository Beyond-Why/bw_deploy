import Link from "next/link";
import { relativeTime } from "@/utils/relativeTime";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./BookmarkEpisodeCard.module.css";

/** Portrait episode card for the Recently Saved grid — same visual
 *  language as the homepage's "Most Popular" cards (thumbnail + DM Serif
 *  title), plus the category/episode labeling and save timestamp that
 *  view needs but the bookmark snapshot alone can't drive that component
 *  with (it expects full MDX-sourced content, not a flat bookmark row). */
export function BookmarkEpisodeCard({ item }: { item: BookmarkItem }) {
  const metaLine =
    item.episodeNumber != null && item.seriesTitle
      ? `Episode ${String(item.episodeNumber).padStart(2, "0")} · ${item.seriesTitle}`
      : item.seriesTitle;

  return (
    <Link href={item.contentUrl} className={styles.card}>
      <div className={styles.thumbWrapper}>
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbnailUrl} alt="" className={styles.thumb} />
        ) : (
          <div className={styles.thumbPlaceholder} aria-hidden="true" />
        )}
      </div>
      <div className={styles.body}>
        {item.contentCategory && <span className={styles.category}>{item.contentCategory}</span>}
        <h3 className={styles.title}>{item.contentTitle}</h3>
        {metaLine && <span className={styles.meta}>{metaLine}</span>}
        <span className={styles.savedAt}>Saved {relativeTime(item.createdAt)}</span>
      </div>
    </Link>
  );
}
