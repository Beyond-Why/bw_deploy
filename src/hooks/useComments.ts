"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface CommentData {
  id: string;
  userId: string;
  userHandle: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  contentId: string;
  contentType: string;
  seriesId: string;
  episodeNumber: string | null;
  episodeTitle: string | null;
  parentId: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface CommentWithReplies extends CommentData {
  replies: CommentData[];
}

export type CommentSort = "newest" | "top";

export interface PostCommentParams {
  contentId: string;
  contentType: "episode" | "series";
  seriesId: string;
  episodeNumber?: string | null;
  episodeTitle?: string | null;
  body: string;
}

interface UseCommentsOptions {
  /** Single episode/hub thread. Takes precedence over `seriesId` when both are set. */
  contentId?: string;
  /** Hub aggregation — every comment across every episode in the series. */
  seriesId?: string;
}

/** Thrown by post/delete when the API returns 401 — callers should catch
 *  this and open the auth modal themselves (see LikeButton/BookmarkButton). */
const AUTH_ERROR_MESSAGE = "__AUTH__";

export function useComments({ contentId, seriesId }: UseCommentsOptions) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<CommentSort>("newest");

  const fetchComments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      if (contentId) query.set("contentId", contentId);
      else if (seriesId) query.set("seriesId", seriesId);
      query.set("sort", sort);

      const res = await fetch(`/api/comments?${query.toString()}`);
      if (!res.ok) throw new Error("Failed to load comments");
      const data: { comments: CommentWithReplies[] } = await res.json();
      setComments(data.comments);
    } catch {
      setError("Couldn't load comments. Try again.");
    } finally {
      setIsLoading(false);
    }
  }, [contentId, seriesId, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const postComment = useCallback(async (params: PostCommentParams): Promise<CommentData> => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
    if (!res.ok) throw new Error("Failed to post comment");
    const data: { comment: CommentWithReplies } = await res.json();
    setComments((prev) => [data.comment, ...prev]);
    return data.comment;
  }, []);

  const postReply = useCallback(
    async (parentId: string, params: PostCommentParams): Promise<CommentData> => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, parentId }),
      });
      if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
      if (!res.ok) throw new Error("Failed to post reply");
      const data: { comment: CommentWithReplies } = await res.json();
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, data.comment] } : c
        )
      );
      return data.comment;
    },
    []
  );

  const snapshotRef = useRef<CommentWithReplies[]>([]);

  const deleteComment = useCallback(async (id: string): Promise<boolean> => {
    const redact = <T extends CommentData>(c: T): T => ({
      ...c,
      isDeleted: true,
      body: "[deleted]",
      userDisplayName: "Deleted",
      userAvatarUrl: null,
    });

    setComments((prev) => {
      snapshotRef.current = prev;
      return prev.map((c) => {
        if (c.id === id) return redact(c);
        if (c.replies.some((r) => r.id === id)) {
          return { ...c, replies: c.replies.map((r) => (r.id === id ? redact(r) : r)) };
        }
        return c;
      });
    });

    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
      if (res.status === 401) throw new Error(AUTH_ERROR_MESSAGE);
      if (!res.ok) throw new Error("Failed to delete comment");
      return true;
    } catch (err) {
      setComments(snapshotRef.current);
      if (err instanceof Error && err.message === AUTH_ERROR_MESSAGE) throw err;
      return false;
    }
  }, []);

  const totalCount = comments.reduce((acc, c) => {
    const top = c.isDeleted ? 0 : 1;
    const replyCount = c.replies.filter((r) => !r.isDeleted).length;
    return acc + top + replyCount;
  }, 0);

  return {
    comments,
    isLoading,
    error,
    sort,
    setSort,
    totalCount,
    postComment,
    postReply,
    deleteComment,
    refresh: fetchComments,
  };
}
