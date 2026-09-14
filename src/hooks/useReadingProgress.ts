"use client";

import { useCallback, useEffect, useRef } from "react";

const ENDPOINT = "/api/reading-progress";
const SAVE_INTERVAL_MS = 10_000;
const COMPLETION_THRESHOLD = 0.8;

interface UseReadingProgressOptions {
  contentId: string;
  contentType: string;
  seriesId?: string | null;
  /** Current scroll position, 0–1 — the caller already computes this (see EpisodeReader's chapter-nav fill). */
  scrollProgress: number;
  isAuthenticated: boolean;
}

/**
 * Silent background progress tracker: throttles saves to once per 10s,
 * fires once immediately the moment 80% is crossed, and flushes on both
 * tab close (sendBeacon) and unmount (SPA nav to next/prev episode never
 * fires beforeunload, so the unmount path is what actually covers that
 * case in the App Router).
 */
export function useReadingProgress({
  contentId,
  contentType,
  seriesId,
  scrollProgress,
  isAuthenticated,
}: UseReadingProgressOptions) {
  const percentRef = useRef(scrollProgress);
  percentRef.current = scrollProgress;

  const lastSavedAtRef = useRef(0);
  const completedRef = useRef(false);

  const beacon = useCallback(
    (completed?: boolean) => {
      if (!isAuthenticated) return;
      const body = JSON.stringify({
        contentId,
        contentType,
        seriesId: seriesId ?? null,
        scrollPercent: percentRef.current,
        completed,
      });
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
    },
    [isAuthenticated, contentId, contentType, seriesId]
  );

  const save = useCallback(
    (completed?: boolean) => {
      if (!isAuthenticated) return;
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          contentType,
          seriesId: seriesId ?? null,
          scrollPercent: percentRef.current,
          completed,
        }),
        keepalive: true,
      }).catch(() => {});
    },
    [isAuthenticated, contentId, contentType, seriesId]
  );

  // Throttled progress saves + a one-time immediate save the moment the
  // episode crosses the completion threshold.
  useEffect(() => {
    if (!isAuthenticated) return;

    if (!completedRef.current && scrollProgress >= COMPLETION_THRESHOLD) {
      completedRef.current = true;
      lastSavedAtRef.current = Date.now();
      save(true);
      return;
    }

    const now = Date.now();
    if (now - lastSavedAtRef.current >= SAVE_INTERVAL_MS) {
      lastSavedAtRef.current = now;
      save();
    }
  }, [scrollProgress, isAuthenticated, save]);

  // Tab close / hard navigation.
  useEffect(() => {
    const handleBeforeUnload = () => beacon(completedRef.current || undefined);
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      // SPA navigation (next/prev episode) unmounts this hook instead of
      // firing beforeunload — flush here so that case is still covered.
      beacon(completedRef.current || undefined);
    };
  }, [beacon]);

  /** Explicit completion, independent of scroll — e.g. a "Next episode" click. */
  const markCompleted = useCallback(() => {
    completedRef.current = true;
    lastSavedAtRef.current = Date.now();
    save(true);
  }, [save]);

  return { markCompleted };
}
