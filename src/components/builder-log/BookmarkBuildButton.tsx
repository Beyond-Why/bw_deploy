"use client";

import { useBookmark, type BookmarkMetadata } from "@/hooks/useBookmark";
import styles from "./LogFeed.module.css";

/**
 * "Bookmark this build" — saves the whole series to the reader's
 * bookmarks (contentType "builder-log", contentId "builder-log/<series>"),
 * listed in the profile's Builder Logs tab. Same useBookmark hook as the
 * episode reader's bookmark button: optimistic, toasts, and sends a
 * signed-out reader to sign in.
 */
export default function BookmarkBuildButton({
  series,
  initialBookmarked,
  initialCount,
  isAuthenticated,
  metadata,
}: {
  series: string;
  initialBookmarked: boolean;
  initialCount: number;
  isAuthenticated: boolean;
  metadata: BookmarkMetadata;
}) {
  const { bookmarked, loading, toggle } = useBookmark({
    contentId: `builder-log/${series}`,
    contentType: "builder-log",
    initialCount,
    initialBookmarked,
    isAuthenticated,
    metadata,
  });

  return (
    <button
      type="button"
      className={`${styles.endButton} ${bookmarked ? styles.endButtonOn : ""}`}
      aria-pressed={bookmarked}
      aria-disabled={loading}
      onClick={toggle}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
      {bookmarked ? "Bookmarked" : "Bookmark this build"}
    </button>
  );
}
