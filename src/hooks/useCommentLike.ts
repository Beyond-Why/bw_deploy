"use client";

import { useCallback, useRef, useState } from "react";

interface UseCommentLikeOptions {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  onRequestAuth: () => void;
}

/** Like/unlike for a single comment or reply — same optimistic-then-
 *  reconcile shape as useLike, scaled down (no animation state, no
 *  sign-in-intent replay: the like just re-fires manually after auth). */
export function useCommentLike({
  commentId,
  initialCount,
  initialLiked,
  isAuthenticated,
  onRequestAuth,
}: UseCommentLikeOptions) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const stateRef = useRef({ count, liked });
  stateRef.current = { count, liked };

  const toggle = useCallback(async () => {
    if (!isAuthenticated) {
      onRequestAuth();
      return;
    }
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const { count: prevCount, liked: prevLiked } = stateRef.current;
    const nextLiked = !prevLiked;
    setLiked(nextLiked);
    setCount(prevCount + (nextLiked ? 1 : -1));

    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: nextLiked ? "POST" : "DELETE",
      });
      if (res.status === 401) {
        onRequestAuth();
        setCount(prevCount);
        setLiked(prevLiked);
        return;
      }
      if (!res.ok) throw new Error("comment like request failed");
      const data: { count: number; liked: boolean } = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      setCount(prevCount);
      setLiked(prevLiked);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [commentId, isAuthenticated, onRequestAuth]);

  return { count, liked, loading, toggle };
}
