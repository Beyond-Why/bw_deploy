"use client";

import { useState } from "react";
import type { BookmarkItem } from "@/components/profile/BookmarksList";

const REMOVE_ANIMATION_MS = 250;

/** Shared unbookmark-from-profile logic — toggles the bookmark off via the
 *  same endpoint the reader's BookmarkButton uses, then (after a beat for
 *  the collapse animation) reports the id back up so the caller can drop
 *  it from whatever list it's rendering. */
export function useBookmarkRemoval(item: BookmarkItem, onRemoved: (id: string) => void) {
  const [removing, setRemoving] = useState(false);
  const [loading, setLoading] = useState(false);

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

  return { removing, loading, handleRemove };
}
