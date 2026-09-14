"use client";

import { relativeTime } from "@/utils/relativeTime";
import type { CommentData } from "@/hooks/useComments";
import { useCommentLike } from "@/hooks/useCommentLike";
import styles from "./CommentSection.module.css";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

interface CommentItemProps {
  comment: CommentData;
  isReply?: boolean;
  showEpisodeTag?: boolean;
  isOwner?: boolean;
  isAuthenticated?: boolean;
  onRequestAuth?: () => void;
  onReplyClick?: () => void;
  onDelete?: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function CommentItem({
  comment,
  isReply = false,
  showEpisodeTag = false,
  isOwner = false,
  isAuthenticated = false,
  onRequestAuth,
  onReplyClick,
  onDelete,
}: CommentItemProps) {
  const avatarSize = isReply ? 26 : 32;
  const initial = (comment.userDisplayName || "?").charAt(0).toUpperCase();
  const absoluteDate = new Date(comment.createdAt).toLocaleString();
  const hasEpisodeTag = showEpisodeTag && !!comment.episodeNumber;

  const { count: likeCount, liked, toggle: toggleLike } = useCommentLike({
    commentId: comment.id,
    initialCount: comment.likeCount,
    initialLiked: comment.likedByMe,
    isAuthenticated,
    onRequestAuth: onRequestAuth ?? (() => {}),
  });

  return (
    <div
      className={cx(
        styles.commentItem,
        isReply && styles.commentItemReply,
        // Only top-level rows get the accent bar — inside a reply's own
        // indent guide it would double up into visual noise.
        hasEpisodeTag && !isReply && styles.commentItemTagged
      )}
    >
      <span
        className={styles.avatar}
        style={{ width: avatarSize, height: avatarSize }}
        aria-hidden="true"
      >
        {comment.userAvatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.userAvatarUrl} alt="" className={styles.avatarImage} />
        ) : (
          <span className={styles.avatarInitial}>{initial}</span>
        )}
      </span>

      <div className={styles.commentBody}>
        <div className={styles.commentMeta}>
          <span className={styles.commentAuthor}>{comment.userDisplayName}</span>
          <span className={styles.commentDot}>·</span>
          <time className={styles.commentTime} dateTime={comment.createdAt} title={absoluteDate}>
            {relativeTime(comment.createdAt)}
          </time>
        </div>

        {hasEpisodeTag && (
          <span className={styles.episodeTag}>
            <span className={styles.episodeTagNum}>Ep {comment.episodeNumber}</span>
            {comment.episodeTitle && (
              <span className={styles.episodeTagTitle}> · {comment.episodeTitle}</span>
            )}
          </span>
        )}

        <p
          className={cx(styles.commentText, comment.isDeleted && styles.commentTextDeleted)}
        >
          {comment.body}
        </p>

        {!comment.isDeleted && (
          <div className={styles.commentActions}>
            <button
              type="button"
              className={cx(styles.likeAction, liked && styles.likeActionActive)}
              aria-pressed={liked}
              aria-label={liked ? "Unlike" : "Like"}
              onClick={toggleLike}
            >
              <HeartIcon filled={liked} />
              {likeCount > 0 && <span className={styles.likeCount}>{likeCount}</span>}
            </button>
            {!isReply && onReplyClick && (
              <button type="button" className={styles.textAction} onClick={onReplyClick}>
                Reply
              </button>
            )}
            {isOwner && onDelete && (
              <button type="button" className={styles.textAction} onClick={onDelete}>
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
