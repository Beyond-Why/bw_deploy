"use client";

import { useState } from "react";
import Link from "next/link";
import { relativeTime } from "@/utils/relativeTime";
import type { CommentActivityItem } from "@/hooks/useRecentComments";
import styles from "./RecentComments.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface ExpandedReply {
  id: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
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

/** Which Deep Dive/hub this comment belongs to — a small link chip, same
 *  role as the discussion UI's own episode tag (CommentItem), just always
 *  shown here since the profile list mixes rows from many different
 *  threads. */
function ContentBadge({ item }: { item: CommentActivityItem }) {
  return (
    <Link href={item.contentHref} className={styles.contentBadge}>
      <span className={styles.contentBadgeTitle}>{item.contentTitle}</span>
      {item.contentType === "episode" && item.episodeNumber && (
        <span className={styles.contentBadgeEpisode}>
          {" "}
          · Ep {item.episodeNumber}
          {item.episodeTitle ? ` · ${item.episodeTitle}` : ""}
        </span>
      )}
    </Link>
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
              <span className={styles.author}>{reply.isDeleted ? "Deleted" : reply.userDisplayName}</span>
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
  deleting: boolean;
  onDelete: (id: string) => void;
}

export function RecentCommentItem({ item, deleting, onDelete }: RecentCommentItemProps) {
  const isReply = item.parentId !== null;
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replies, setReplies] = useState<ExpandedReply[] | null>(null);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesError, setRepliesError] = useState(false);

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
      setReplies(data.replies);
    } catch {
      setRepliesError(true);
    } finally {
      setRepliesLoading(false);
    }
  };

  return (
    <div className={cx(styles.item, isReply && styles.itemReply, deleting && styles.itemDeleting)}>
      <span className={styles.kicker}>{isReply ? "Your reply" : "Your comment"}</span>

      <div className={styles.itemRow}>
        <Avatar name={item.userDisplayName} url={item.userAvatarUrl} />
        <div className={styles.itemBody}>
          <div className={styles.metaRow}>
            <span className={styles.author}>{item.userDisplayName}</span>
            <span className={styles.dot}>·</span>
            <time className={styles.time} dateTime={item.createdAt}>
              {relativeTime(item.createdAt)}
            </time>
          </div>

          <ContentBadge item={item} />

          {isReply && item.parent && (
            <div className={styles.parentContext}>
              <span className={styles.parentContextLabel}>
                Replying to {item.parent.isDeleted ? "Deleted" : item.parent.userDisplayName}
              </span>
              <p className={cx(styles.parentContextBody, item.parent.isDeleted && styles.bodyTextDeleted)}>
                {item.parent.body}
              </p>
            </div>
          )}

          <p className={styles.bodyText}>{item.body}</p>

          <div className={styles.actions}>
            {!isReply && item.replyCount > 0 && (
              <button type="button" className={styles.repliesToggle} onClick={toggleReplies}>
                {repliesOpen
                  ? "Hide replies ▴"
                  : `${item.replyCount} ${item.replyCount === 1 ? "reply" : "replies"} ▾`}
              </button>
            )}
            <Link href={item.contentHref} className={styles.textAction}>
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
