"use client";

import Link from "next/link";
import { useState } from "react";
import { DeepDiveIcon } from "@/components/icons/DeepDiveIcon";
import { InsightCardIcon } from "@/components/icons/InsightCardIcon";
import { BuilderLogIcon } from "@/components/icons/BuilderLogIcon";
import { formatSavedAt } from "@/lib/relativeTime";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./BookmarksList.module.css";

const REMOVE_ANIMATION_MS = 250;

const TYPE_ICON: Record<string, typeof DeepDiveIcon> = {
  episode: DeepDiveIcon,
  series: DeepDiveIcon,
  "insight-card": InsightCardIcon,
  "insight-collection": InsightCardIcon,
  "builder-log": BuilderLogIcon,
};

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface BookmarkCardProps {
  item: BookmarkItem;
  onRemoved: (id: string) => void;
}

/** A single saved bookmark, rendered as a compact playlist-style row —
 *  thumbnail left, title/tag/date right, remove button on row hover. */
export function BookmarkCard({ item, onRemoved }: BookmarkCardProps) {
  const [removing, setRemoving] = useState(false);
  const [loading, setLoading] = useState(false);

  const Icon = TYPE_ICON[item.contentType] ?? DeepDiveIcon;

  const handleRemove = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId: item.contentId,
          contentType: item.contentType,
          metadata: {
            contentTitle: item.contentTitle,
            contentUrl: item.contentUrl,
            seriesTitle: item.seriesTitle,
            seriesSlug: item.seriesSlug,
            episodeNumber: item.episodeNumber,
            thumbnailUrl: item.thumbnailUrl,
          },
        }),
      });
      if (!res.ok) throw new Error("remove failed");
      setRemoving(true);
      setTimeout(() => onRemoved(item.id), REMOVE_ANIMATION_MS);
    } catch {
      setLoading(false);
    }
  };

  const tag =
    item.seriesTitle && item.episodeNumber != null
      ? `${item.seriesTitle} · EP ${String(item.episodeNumber).padStart(2, "0")}`
      : (item.seriesTitle ?? undefined);

  return (
    <div className={cx(styles.row, removing && styles.rowRemoving)}>
      <Link href={item.contentUrl} className={styles.rowLink}>
        <div className={styles.thumb}>
          {item.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt="" className={styles.thumbImage} />
          ) : (
            <span className={styles.thumbPlaceholder} aria-hidden="true">
              <Icon size={24} />
            </span>
          )}
        </div>
        <div className={styles.rowText}>
          {tag && <span className={styles.rowTag}>{tag}</span>}
          <span className={styles.rowTitle}>{item.contentTitle}</span>
          <span className={styles.rowDate}>{formatSavedAt(item.createdAt)}</span>
        </div>
      </Link>
      <button
        type="button"
        className={styles.removeBtn}
        aria-label="Remove bookmark"
        disabled={loading}
        onClick={(e) => {
          e.preventDefault();
          handleRemove();
        }}
      >
        ×
      </button>
    </div>
  );
}
