"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export type LikeAnimation = "like" | "unlike" | "error" | null;

interface UseLikeOptions {
  contentId: string;
  contentType: string;
  initialCount: number;
  initialLiked: boolean;
  isAuthenticated: boolean;
  /** Reading progress (0–1) — accepted for API-compatibility with callers
   *  that track it for other purposes; unused here now that a logged-out
   *  click just navigates to /signin instead of queuing an intent to
   *  replay post sign-in. */
  scrollPercent?: number;
}

/** Formats a like count for display: under 1000 as-is, otherwise "1.2k" style. */
export function formatLikeCount(n: number): string {
  if (n < 1000) return String(n);
  const value = n / 1000;
  const rounded = value >= 100 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded}k`;
}

export function useLike({
  contentId,
  contentType,
  initialCount,
  initialLiked,
  isAuthenticated,
}: UseLikeOptions) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const [animationType, setAnimationType] = useState<LikeAnimation>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const router = useRouter();
  const pathname = usePathname();

  const loadingRef = useRef(false);
  const stateRef = useRef({ count, liked });
  stateRef.current = { count, liked };

  const performToggle = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);

    const { count: prevCount, liked: prevLiked } = stateRef.current;
    const nextLiked = !prevLiked;

    setLiked(nextLiked);
    setCount(prevCount + (nextLiked ? 1 : -1));
    setAnimationType(nextLiked ? "like" : "unlike");
    setAnimationKey((k) => k + 1);

    try {
      const res = await fetch("/api/likes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, contentType }),
      });
      if (!res.ok) throw new Error("like request failed");
      const data: { count: number; liked: boolean } = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      setCount(prevCount);
      setLiked(prevLiked);
      setAnimationType("error");
      setAnimationKey((k) => k + 1);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [contentId, contentType]);

  const toggle = useCallback(() => {
    if (!isAuthenticated) {
      router.push(`/signin?next=${encodeURIComponent(pathname)}`);
      return;
    }
    performToggle();
  }, [isAuthenticated, router, pathname, performToggle]);

  return { count, liked, loading, toggle, animationType, animationKey };
}
