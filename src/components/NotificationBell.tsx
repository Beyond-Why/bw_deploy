"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications, type NotificationItem, type NotificationType } from "@/hooks/useNotifications";
import type { PollOption } from "@/lib/db/schema";
import styles from "./NotificationBell.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function BellIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PollIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="6" y1="20" x2="6" y2="12" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="18" y1="20" x2="18" y2="9" />
    </svg>
  );
}

const TYPE_ICON: Record<NotificationType, React.ReactNode> = {
  new_deep_dive: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  new_episode: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  new_insight_collection: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  poll: <PollIcon />,
};

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* ── Poll notifications — self-contained inline voting/results ── */

interface PollData {
  poll: { id: string; question: string; options: PollOption[]; expiresAt: string | null };
  results: Record<string, number>;
  userVote: string | null;
}

interface PollUiState {
  loading: boolean;
  error: string | null;
  data: PollData | null;
  voting: boolean;
}

/** contentUrl is always "/polls/{pollId}" (see POST /api/admin/polls). */
function extractPollId(contentUrl: string): string | null {
  const match = contentUrl.match(/^\/polls\/([^/?#]+)/);
  return match ? match[1] : null;
}

function PollBody({
  data,
  voting,
  error,
  onVote,
}: {
  data: PollData;
  voting: boolean;
  error: string | null;
  onVote: (optionId: string) => void;
}) {
  const { poll, results, userVote } = data;

  if (userVote === null) {
    return (
      <span className={styles.pollOptions}>
        {poll.options.map((option) => (
          <button
            key={option.id}
            type="button"
            className={styles.pollOptionButton}
            disabled={voting}
            onClick={(e) => {
              e.stopPropagation();
              onVote(option.id);
            }}
          >
            {option.label}
          </button>
        ))}
        {error && <span className={styles.pollError}>{error}</span>}
      </span>
    );
  }

  const total = Object.values(results).reduce((sum, n) => sum + n, 0);

  return (
    <span className={styles.pollResults}>
      {poll.options.map((option) => {
        const count = results[option.id] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isChosen = option.id === userVote;
        return (
          <span
            key={option.id}
            className={cx(styles.pollResultRow, isChosen && styles.pollResultRowChosen)}
          >
            <span className={styles.pollResultLabelRow}>
              <span className={styles.pollResultLabel}>{option.label}</span>
              <span className={styles.pollResultPct}>{pct}%</span>
            </span>
            <span className={styles.pollResultBarTrack} aria-hidden="true">
              <span className={styles.pollResultBarFill} style={{ width: `${pct}%` }} />
            </span>
          </span>
        );
      })}
      <span className={styles.pollTotal}>
        {total} {total === 1 ? "vote" : "votes"}
      </span>
    </span>
  );
}

/** Navbar notification bell — polled unread state via useNotifications.
 *  Only rendered for signed-in users (see Navigation.tsx). */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications(true);

  const [pollStates, setPollStates] = useState<Record<string, PollUiState>>({});

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const fetchPoll = useCallback(async (pollId: string) => {
    setPollStates((prev) => ({
      ...prev,
      [pollId]: { loading: true, error: null, data: prev[pollId]?.data ?? null, voting: false },
    }));
    try {
      const res = await fetch(`/api/polls/${pollId}`);
      if (!res.ok) throw new Error("load failed");
      const data: PollData = await res.json();
      setPollStates((prev) => ({ ...prev, [pollId]: { loading: false, error: null, data, voting: false } }));
    } catch {
      setPollStates((prev) => ({
        ...prev,
        [pollId]: {
          loading: false,
          error: "Couldn't load this poll",
          data: prev[pollId]?.data ?? null,
          voting: false,
        },
      }));
    }
  }, []);

  // Fetch each poll notification's live state once the dropdown is open —
  // skips ones already fetched (or already in flight).
  useEffect(() => {
    if (!open) return;
    for (const item of notifications) {
      if (item.type !== "poll") continue;
      const pollId = extractPollId(item.contentUrl);
      if (!pollId || pollStates[pollId]) continue;
      fetchPoll(pollId);
    }
    // pollStates is intentionally excluded — this only decides which polls
    // still need a first fetch, it must not re-run every time one arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, notifications, fetchPoll]);

  const handleVote = useCallback(
    async (item: NotificationItem, pollId: string, optionId: string) => {
      setPollStates((prev) => ({
        ...prev,
        [pollId]: { ...prev[pollId], voting: true, error: null },
      }));

      try {
        const res = await fetch(`/api/polls/${pollId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ optionId }),
        });
        // 409 (already voted) still resolves to the real, current state
        // below — only a genuine failure short-circuits into the catch.
        if (!res.ok && res.status !== 409) throw new Error("vote failed");

        await fetchPoll(pollId);
        if (!item.read) markOneRead(item.id);
      } catch {
        setPollStates((prev) => ({
          ...prev,
          [pollId]: { ...prev[pollId], voting: false, error: "Couldn't submit your vote" },
        }));
      }
    },
    [fetchPoll, markOneRead]
  );

  const handleItemClick = (item: NotificationItem) => {
    if (!item.read) markOneRead(item.id);
    close();
    router.push(item.contentUrl);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.btn}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon />
        {unreadCount > 0 && <span className={styles.dot} aria-hidden="true" />}
      </button>

      {open && (
        <div className={styles.menu} role="menu">
          <div className={styles.header}>
            <span className={styles.headerTitle}>Notifications</span>
            <button
              type="button"
              className={styles.markAllButton}
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              Mark all read
            </button>
          </div>

          <div className={styles.list}>
            {notifications.length === 0 ? (
              <p className={styles.empty}>Nothing yet — check back when new content drops</p>
            ) : (
              notifications.map((item) => {
                if (item.type === "poll") {
                  const pollId = extractPollId(item.contentUrl);
                  const state = pollId ? pollStates[pollId] : undefined;

                  return (
                    <div
                      key={item.id}
                      className={cx(styles.item, styles.itemPoll, !item.read && styles.itemUnread)}
                    >
                      <span className={styles.itemIcon} aria-hidden="true">
                        {TYPE_ICON.poll}
                      </span>
                      <span className={styles.itemBody}>
                        <span className={styles.itemTitle}>{item.title}</span>

                        {!pollId ? (
                          <span className={styles.pollError}>Couldn&apos;t load this poll</span>
                        ) : !state || (state.loading && !state.data) ? (
                          <span className={styles.pollLoading}>Loading…</span>
                        ) : state.data ? (
                          <PollBody
                            data={state.data}
                            voting={state.voting}
                            error={state.error}
                            onVote={(optionId) => handleVote(item, pollId, optionId)}
                          />
                        ) : (
                          <span className={styles.pollError}>{state.error ?? "Couldn't load this poll"}</span>
                        )}

                        <span className={styles.itemTime}>{relativeTime(item.createdAt)}</span>
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className={cx(styles.item, !item.read && styles.itemUnread)}
                    onClick={() => handleItemClick(item)}
                  >
                    <span className={styles.itemIcon} aria-hidden="true">
                      {TYPE_ICON[item.type]}
                    </span>
                    <span className={styles.itemBody}>
                      <span className={styles.itemTitle}>{item.title}</span>
                      <span className={styles.itemMessage}>{item.body}</span>
                      <span className={styles.itemTime}>{relativeTime(item.createdAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
