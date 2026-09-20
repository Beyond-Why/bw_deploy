"use client";

import { useState } from "react";
import Link from "next/link";
import { relativeTime } from "@/utils/relativeTime";
import { formatHandle } from "@/utils/formatHandle";
import type { CommentActivityItem } from "@/hooks/useRecentComments";
import styles from "./RecentComments.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface ExpandedReply {
  id: string;
  userHandle: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
}

/** "Deleted" for a redacted comment, otherwise the @handle (falling back
 *  to the display name only if a handle is somehow missing). */
function authorLabel(isDeleted: boolean, userHandle: string, userDisplayName: string): string {
  if (isDeleted) return "Deleted";
  return formatHandle(userHandle) ?? userDisplayName;
}

/** Where "View discussion" actually lands. A hub-level ("series")
 *  comment's Discussion section lives directly on that hub page, so the
 *  link jumps straight to it (#discussion — see HubDiscussion.tsx and
 *  its scroll-margin-top). An episode comment's discussion is a sidebar
 *  *tab* on the episode reader, not a scrollable page section — there's
 *  nothing on that page for a hash to scroll to, so its href is left
 *  exactly as before rather than appending an anchor that would do
 *  nothing (or land on an unrelated element if `discussion` ever meant
 *  something else there). */
function viewDiscussionHref(item: CommentActivityItem): string {
  return item.contentType === "series" ? `${item.contentHref}#discussion` : item.contentHref;
}

function Avatar({ name, url, size = 32 }: { name: string; url: string | null; size?: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span className={styles.avatar} style={{ width: size, height: size }} aria-hidden="true">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className={styles.avatarImage} />
      ) : (
        <span className={styles.avatarInitial}>{initial}</span>
      )}
    </span>
  );
}

/** Which Deep Dive/hub (and, when relevant, which episode) this comment
 *  belongs to. The Deep Dive tag always points at the series hub — unlike
 *  the hub discussion's own comments (which dropped this tag, since
 *  they're already all on that one series' page), Recent Comments spans
 *  every series the user's ever commented on, so it's still needed here.
 *  The episode tag (only for episode-scoped comments) is compact — "EP N"
 *  — with the full title one hover/focus away via a tooltip, same
 *  treatment as the hub discussion's own episode tag. */
function ContentTags({ item }: { item: CommentActivityItem }) {
  const hasEpisode = item.contentType === "episode" && !!item.episodeNumber;
  const episodeTooltip = hasEpisode
    ? item.episodeTitle
      ? `EP ${item.episodeNumber}: ${item.episodeTitle}`
      : `EP ${item.episodeNumber}`
    : "";

  return (
    <span className={styles.tagRow}>
      <Link href={`/deep-dives/${item.seriesId}`} className={styles.contentBadge} title={item.contentTitle}>
        {item.contentTitle}
      </Link>
      {hasEpisode && (
        <span className={styles.episodeTagWrap}>
          <Link
            href={item.contentHref}
            className={cx(styles.contentBadge, styles.episodeBadge)}
            aria-label={episodeTooltip}
          >
            EP {item.episodeNumber}
          </Link>
          <span className={styles.episodeTooltip} aria-hidden="true">
            {episodeTooltip}
          </span>
        </span>
      )}
    </span>
  );
}

function RepliesList({ replies }: { replies: ExpandedReply[] }) {
  return (
    <div className={styles.repliesList}>
      {replies.map((reply) => (
        <div key={reply.id} className={styles.nestedReply}>
          <Avatar name={reply.userDisplayName} url={reply.userAvatarUrl} size={24} />
          <div className={styles.nestedReplyBody}>
            <div className={styles.metaRow}>
              <span className={styles.author}>
                {authorLabel(reply.isDeleted, reply.userHandle, reply.userDisplayName)}
              </span>
              <span className={styles.dot}>·</span>
              <time className={styles.time} dateTime={reply.createdAt}>
                {relativeTime(reply.createdAt)}
              </time>
            </div>
            <p className={cx(styles.bodyText, reply.isDeleted && styles.bodyTextDeleted)}>
              {reply.isDeleted ? "[deleted]" : reply.body}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface RecentCommentItemProps {
  item: CommentActivityItem;
  deletingIds: Set<string>;
  onDelete: (id: string) => void;
  /** The profile owner's own replies to `item`, already grouped and
   *  rendered as their own entries right after this one (see
   *  RecentCommentsList) — used only to keep the "N replies" expansion
   *  below from re-showing them and to adjust its count. Top-level only. */
  ownReplies?: CommentActivityItem[];
  /** True when `item`'s parent is already rendered directly above it as
   *  part of the same grouped conversation — skips the "Replying to…"
   *  block, which would otherwise just repeat what's already visible. */
  suppressParentContext?: boolean;
}

export function RecentCommentItem({
  item,
  deletingIds,
  onDelete,
  ownReplies = [],
  suppressParentContext = false,
}: RecentCommentItemProps) {
  const isReply = item.parentId !== null;
  const deleting = deletingIds.has(item.id);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<ExpandedReply[] | null>(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState(false);

  // Replies already shown via `ownReplies` shouldn't also turn up in the
  // "N replies" expansion below (that fetches every reply from every
  // author) — filtered out, and the count adjusted to match what's
  // actually new there.
  const ownReplyIds = new Set(ownReplies.map((r) => r.id));
  const otherReplyCount = Math.max(0, item.replyCount - ownReplies.length);

  const toggleReplies = async () => {
    if (repliesOpen) {
      setRepliesOpen(false);
      return;
    }
    setRepliesOpen(true);
    if (replies !== null) return;

    setRepliesLoading(true);
    setRepliesError(false);
    try {
      const res = await fetch(`/api/comments/${item.id}/replies`);
      if (!res.ok) throw new Error("Failed to load replies");
      const data: { replies: ExpandedReply[] } = await res.json();
      setReplies(data.replies.filter((r) => !ownReplyIds.has(r.id)));
    } catch {
      setRepliesError(true);
    } finally {
      setRepliesLoading(false);
    }
  };

  return (
    <div className={cx(styles.item, isReply && styles.itemReply, deleting && styles.itemDeleting)}>
      <div className={styles.itemRow}>
        <Avatar name={item.userDisplayName} url={item.userAvatarUrl} />
        <div className={styles.itemBody}>
          <div className={styles.metaRow}>
            <span className={styles.authorTime}>
              <span className={styles.author}>
                {authorLabel(false, item.userHandle, item.userDisplayName)}
              </span>
              <span className={styles.dot}>·</span>
              <time className={styles.time} dateTime={item.createdAt}>
                {relativeTime(item.createdAt)}
              </time>
            </span>

            <ContentTags item={item} />
          </div>

          {isReply && item.parent && !suppressParentContext && (
            <div className={styles.parentContext}>
              <span className={styles.parentContextLabel}>
                Replying to {authorLabel(item.parent.isDeleted, item.parent.userHandle, item.parent.userDisplayName)}
              </span>
              <p className={cx(styles.parentContextBody, item.parent.isDeleted && styles.bodyTextDeleted)}>
                {item.parent.body}
              </p>
            </div>
          )}

          <p className={styles.bodyText}>{item.body}</p>

          <div className={styles.actions}>
            {!isReply && otherReplyCount > 0 && (
              <button type="button" className={styles.repliesToggle} onClick={toggleReplies}>
                {repliesOpen
                  ? "Hide replies ▴"
                  : `${otherReplyCount} more ${otherReplyCount === 1 ? "reply" : "replies"} ▾`}
              </button>
            )}
            <Link href={viewDiscussionHref(item)} className={styles.textAction}>
              View discussion
            </Link>
            <button
              type="button"
              className={cx(styles.textAction, styles.deleteAction)}
              disabled={deleting}
              onClick={() => onDelete(item.id)}
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>

          {!isReply && repliesOpen && (
            <>
              {repliesLoading && <p className={styles.repliesStatus}>Loading replies…</p>}
              {repliesError && <p className={styles.repliesStatus}>Couldn&apos;t load replies.</p>}
              {replies && replies.length > 0 && <RepliesList replies={replies} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
