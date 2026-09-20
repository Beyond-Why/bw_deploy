"use client";

import { useCallback, useRef, useState } from "react";

export interface RecentCommentParent {
  id: string;
  userHandle: string;
  userDisplayName: string;
  body: string;
  isDeleted: boolean;
}

export interface CommentActivityItem {
  id: string;
  userHandle: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  contentId: string;
  contentType: string;
  seriesId: string;
  episodeNumber: string | null;
  episodeTitle: string | null;
  body: string;
  createdAt: string;
  parentId: string | null;
  parent: RecentCommentParent | null;
  replyCount: number;
  contentTitle: string;
  contentHref: string;
}

export interface RecentCommentsCursor {
  createdAt: string;
  id: string;
}

interface UseRecentCommentsOptions {
  initialItems: CommentActivityItem[];
  initialHasMore: boolean;
  initialCursor: RecentCommentsCursor | null;
}

/** Client-side state for the profile's Recent Comments section — "Load
 *  more" pagination plus per-item delete, both against a list the server
 *  already rendered once. Mirrors useComments' shape (own state + fetch
 *  helpers, snapshot-and-revert on failure) but scoped to one user's own
 *  activity instead of one thread. */
export function useRecentComments({
  initialItems,
  initialHasMore,
  initialCursor,
}: UseRecentCommentsOptions) {
  const [items, setItems] = useState(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadMoreState, setLoadMoreState] = useState<"idle" | "loading" | "error">("idle");
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const inFlightDeletes = useRef<Set<string>>(new Set());

  const loadMore = useCallback(async () => {
    if (!cursor || loadMoreState === "loading") return;
    setLoadMoreState("loading");
    try {
      const query = new URLSearchParams({
        cursorCreatedAt: cursor.createdAt,
        cursorId: cursor.id,
      });
      const res = await fetch(`/api/profile/comments?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load more comments");
      const data: { items: CommentActivityItem[]; nextCursor: RecentCommentsCursor | null; hasMore: boolean } =
        await res.json();

      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...data.items.filter((i) => !seen.has(i.id))];
      });
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
      setLoadMoreState("idle");
    } catch {
      setLoadMoreState("error");
    }
  }, [cursor, loadMoreState]);

  const deleteComment = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    if (inFlightDeletes.current.has(id)) return { ok: false };
    inFlightDeletes.current.add(id);
    setDeletingIds((prev) => new Set(prev).add(id));

    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error(res.status === 401 ? "Sign in to delete this comment." : "Couldn't delete comment.");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Couldn't delete comment." };
    } finally {
      inFlightDeletes.current.delete(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  return {
    items,
    hasMore,
    loadMoreState,
    loadMore,
    deleteComment,
    deletingIds,
  };
}
