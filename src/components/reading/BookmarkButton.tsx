"use client";

import { useEffect, useRef } from "react";
import { useBookmark, type BookmarkMetadata } from "@/hooks/useBookmark";
import styles from "./EpisodeReader.module.css";

export interface BookmarkState {
  count: number;
  bookmarked: boolean;
}

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface BookmarkButtonProps {
  contentId: string;
  contentType: string;
  initialCount: number;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
  metadata: BookmarkMetadata;
  /** Current reading progress (0–1), attached to the sign-in intent for logged-out clicks. */
  scrollPercent?: number;
  /** 'compact' drops the button box (border/background/padding) and shrinks
   *  the icon for tight spaces like the insight card top bar. */
  size?: "default" | "compact";
  /** Reports the live count/bookmarked state back up whenever it changes —
   *  lets a parent that persists across this button's remounts (e.g. a
   *  card-to-card slide transition that recreates this component) re-seed
   *  the next mount with the latest known value instead of the original
   *  server-fetched one. */
  onStateChange?: (state: BookmarkState) => void;
}

export function BookmarkButton({
  contentId,
  contentType,
  initialCount,
  initialBookmarked,
  isAuthenticated,
  metadata,
  scrollPercent,
  size = "default",
  onStateChange,
}: BookmarkButtonProps) {
  const { count, bookmarked, loading, toggle, animationType, animationKey } = useBookmark({
    contentId,
    contentType,
    initialCount,
    initialBookmarked,
    isAuthenticated,
    metadata,
    scrollPercent,
  });
  const compact = size === "compact";

  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.({ count, bookmarked });
  }, [count, bookmarked]);

  return (
    <button
      type="button"
      className={cx(
        styles.actionBtn,
        styles.bookmarkBtn,
        bookmarked && styles.bookmarkBtnActive,
        loading && styles.bookmarkBtnLoading,
        compact && styles.actionBtnCompact
      )}
      aria-pressed={bookmarked}
      aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
      aria-disabled={loading}
      onClick={toggle}
    >
      <span
        key={animationKey}
        className={cx(styles.bookmarkInner, animationType === "error" && styles.likeShake)}
      >
        <svg
          className={cx(
            styles.actionIcon,
            compact && styles.actionIconCompact,
            loading && styles.likeIconLoading,
            animationType === "bookmark" && styles.bookmarkIconSave,
            animationType === "unbookmark" && styles.bookmarkIconRemove
          )}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={bookmarked ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </span>
    </button>
  );
}
