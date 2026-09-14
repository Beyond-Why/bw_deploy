"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/hooks/useToast";

export interface BookmarkMetadata {
  contentTitle: string;
  contentUrl: string;
  seriesTitle?: string | null;
  seriesSlug?: string | null;
  episodeNumber?: number | null;
  thumbnailUrl?: string | null;
  /** Insight collections only — the card the user was on when they
   *  bookmarked, so the profile's saved-collection carousel can resume there. */
  activeCardIndex?: number | null;
  /** Episodes/series only — the series' category/subject (e.g. "Foundation
   *  & Reality"), separate from seriesTitle so a bookmark card can show
   *  both without repeating the series name. */
  contentCategory?: string | null;
}

export type BookmarkAnimation = "bookmark" | "unbookmark" | "error" | null;

interface UseBookmarkOptions {
  contentId: string;
  contentType: string;
  initialCount: number;
  initialBookmarked: boolean;
  isAuthenticated: boolean;
  metadata: BookmarkMetadata;
  /** Reading progress (0–1) — accepted for API-compatibility with callers
   *  that track it for other purposes; unused here now that a logged-out
   *  click just navigates to /signin instead of queuing an intent to
   *  replay post sign-in. */
  scrollPercent?: number;
}

export function useBookmark({
  contentId,
  contentType,
  initialCount,
  initialBookmarked,
  isAuthenticated,
  metadata,
}: UseBookmarkOptions) {
  const [count, setCount] = useState(initialCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const [animationType, setAnimationType] = useState<BookmarkAnimation>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();

  const loadingRef = useRef(false);
  const stateRef = useRef({ count, bookmarked });
  stateRef.current = { count, bookmarked };
  const metadataRef = useRef(metadata);
  metadataRef.current = metadata;

  const performToggle = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const { count: prevCount, bookmarked: prevBookmarked } = stateRef.current;
    const nextBookmarked = !prevBookmarked;

    setBookmarked(nextBookmarked);
    setCount(prevCount + (nextBookmarked ? 1 : -1));
    setAnimationType(nextBookmarked ? "bookmark" : "unbookmark");
    setAnimationKey((k) => k + 1);

    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType, metadata: metadataRef.current }),
      });
      if (!res.ok) throw new Error("bookmark request failed");
      const data: { count: number; bookmarked: boolean } = await res.json();
      setCount(data.count);
      setBookmarked(data.bookmarked);
      toast.show({
        message: data.bookmarked ? "Saved to bookmarks" : "Removed from bookmarks",
      });
    } catch {
      setCount(prevCount);
      setBookmarked(prevBookmarked);
      setAnimationType("error");
      setAnimationKey((k) => k + 1);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [contentId, contentType, toast]);

  const toggle = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    performToggle();
  }, [isAuthenticated, router, pathname, performToggle]);

  return { count, bookmarked, loading, toggle, animationType, animationKey };
}
