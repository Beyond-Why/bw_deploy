"use client";

import { useEffect, useState } from "react";
import { InsightCollectionBlock, type InsightRowCardItem } from "@/components/library";
import { relativeTime } from "@/utils/relativeTime";
import { useBookmarkRemoval } from "@/hooks/useBookmarkRemoval";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./InsightSaveStack.module.css";

export interface RecentInsightSave {
  bookmark: BookmarkItem;
  title: string;
  cards: InsightRowCardItem[];
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function InsightSaveBlock({
  save,
  onRemoved,
}: {
  save: RecentInsightSave;
  onRemoved: (id: string) => void;
}) {
  const { removing, loading, handleRemove } = useBookmarkRemoval(save.bookmark, onRemoved);

  return (
    <div className={cx(styles.block, removing && styles.removing)}>
      <InsightCollectionBlock
        title={save.title}
        cards={save.cards}
        initialIndex={save.bookmark.activeCardIndex ?? 0}
        quietHeading
        trailingLabel={`Saved ${relativeTime(save.bookmark.createdAt)}`}
        headerAction={
          <button
            type="button"
            className={styles.removeBtn}
            aria-label="Remove bookmark"
            disabled={loading}
            onClick={handleRemove}
          >
            ×
          </button>
        }
      />
    </div>
  );
}

interface InsightSaveStackProps {
  saves: RecentInsightSave[];
  /** Recently Saved (Home tab) only — reports the live post-removal count
   *  back up so the parent can swap in an empty state once every save
   *  (collections + episodes) is gone. Omitted by the standalone Insight
   *  Cards tab, which has no such combined empty state to manage. */
  onCountChange?: (count: number) => void;
}

/** Bookmarked insight collections as full-width bar carousels, each
 *  resuming at the card the user was on when they saved it — the same
 *  form used by the Home tab's Recently Saved and the Insight Cards tab. */
export function InsightSaveStack({ saves: initialSaves, onCountChange }: InsightSaveStackProps) {
  const [saves, setSaves] = useState(initialSaves);

  const remove = (id: string) => {
    setSaves((prev) => prev.filter((s) => s.bookmark.id !== id));
  };

  useEffect(() => {
    onCountChange?.(saves.length);
  }, [saves.length, onCountChange]);

  if (saves.length === 0) return null;

  return (
    <div className={styles.stack}>
      {saves.map((save) => (
        <InsightSaveBlock key={save.bookmark.id} save={save} onRemoved={remove} />
      ))}
    </div>
  );
}
