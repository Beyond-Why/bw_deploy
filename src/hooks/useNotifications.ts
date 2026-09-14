"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const POLL_INTERVAL_MS = 60_000;

export type NotificationType =
  | "new_deep_dive"
  | "new_episode"
  | "new_insight_collection"
  | "poll";

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  contentUrl: string;
  read: boolean;
  createdAt: string;
}

/** Polls GET /api/notifications every 60s and on window focus, keeping
 *  the navbar bell's unread count fresh without a websocket. Enabled is
 *  the signed-in gate — no polling at all when signed out. */
export function useNotifications(enabled: boolean) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const fetchingRef = useRef(false);

  const refresh = useCallback(async () => {
    if (!enabled || fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data: { notifications: NotificationItem[]; unreadCount: number } = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // Silent — the bell just keeps showing its last-known state.
    } finally {
      fetchingRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    refresh();

    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } catch {
      // Best-effort — next poll reconciles the real state.
    }
  }, []);

  const markOneRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await fetch("/api/notifications/read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Best-effort — next poll reconciles the real state.
    }
  }, []);

  return { notifications, unreadCount, loading, refresh, markAllRead, markOneRead };
}
