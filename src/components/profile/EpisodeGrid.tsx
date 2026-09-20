"use client";

import { useEffect, useState } from "react";
import { useBookmarkRemoval } from "@/hooks/useBookmarkRemoval";
import { BookmarkEpisodeCard } from "./BookmarkEpisodeCard";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./EpisodeGrid.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function EpisodeGridItem({ item, onRemoved }: { item: BookmarkItem; onRemoved: (id: string) => void }) {
  const { removing, loading, handleRemove } = useBookmarkRemoval(item, onRemoved);

  return (
    <div className={cx(styles.entry, removing && styles.removing)}>
      <BookmarkEpisodeCard item={item} />
      <button
        type="button"
        className={styles.removeBtn}
        aria-label="Remove bookmark"
        disabled={loading}
        onClick={handleRemove}
      >
        ×
      </button>
    </div>
  );
}

interface EpisodeGridProps {
  items: BookmarkItem[];
  /** Recently Saved only — how many full-width insight-carousel rows sit
   *  above this grid, so the row-cap CSS (see EpisodeGrid.module.css) can
   *  hide cards past the remaining row budget for the current column
   *  count. Omitted by the standalone Deep Dives tab, which renders every
   *  item uncapped. */
  collectionRows?: number;
  /** Recently Saved (Home tab) only — reports the live post-removal count
   *  back up so the parent can swap in an empty state once every save
   *  (collections + episodes) is gone. Omitted by the standalone Deep
   *  Dives tab, which has no such combined empty state to manage. */
  onCountChange?: (count: number) => void;
}

/** Bookmarked episodes as a responsive portrait grid — the same form used
 *  by the Home tab's Recently Saved and the Deep Dives tab. */
export function EpisodeGrid({ items: initialItems, collectionRows, onCountChange }: EpisodeGridProps) {
  const [items, setItems] = useState(initialItems);

  const remove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  useEffect(() => {
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  if (items.length === 0) return null;

  return (
    <div className={styles.grid} data-collection-rows={collectionRows}>
      {items.map((item) => (
        <EpisodeGridItem key={item.id} item={item} onRemoved={remove} />
      ))}
    </div>
  );
}
