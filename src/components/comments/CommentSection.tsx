"use client";

import { useId, useState } from "react";
import { useComments, type CommentWithReplies } from "@/hooks/useComments";
import { CommentInput } from "./CommentInput";
import { CommentThread } from "./CommentThread";
import styles from "./CommentSection.module.css";

export interface CurrentUser {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CommentSectionProps {
  /** Single episode/hub thread. Omit + pass `seriesId` alone for hub aggregation. */
  contentId?: string;
  seriesId?: string;
  contentType: "episode" | "series";
  episodeNumber?: string;
  episodeTitle?: string;
  user: CurrentUser | null;
  onRequestAuth: () => void;
  /** Hub page only — shows "Ep N · Title" tags on episode-origin comments. */
  showEpisodeTags?: boolean;
  /** Caps the initial number of visible top-level threads, revealed via a
   *  "Show more" button — the hub page uses this to keep its aggregated
   *  view from running long; the episode sidebar omits it (shows all). */
  initialVisibleCount?: number;
  className?: string;
}

const AUTH_ERROR_MESSAGE = "__AUTH__";

function cx(...classes: Array<string | false | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

function SpeechBubbleIcon() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

export function CommentSection({
  contentId,
  seriesId,
  contentType,
  episodeNumber,
  episodeTitle,
  user,
  onRequestAuth,
  showEpisodeTags = false,
  initialVisibleCount,
  className,
}: CommentSectionProps) {
  const composerId = useId();
  const [expanded, setExpanded] = useState(false);

  // New hub-level comments are filed one level up from any episode
  // ('deep-dives/{seriesId}') — only relevant when there's no explicit
  // contentId, i.e. this section is the hub's aggregated view.
  const postContentId = contentId ?? (seriesId ? `deep-dives/${seriesId}` : undefined);

  const {
    comments,
    isLoading,
    error,
    sort,
    setSort,
    totalCount,
    postComment,
    postReply,
    deleteComment,
  } = useComments(contentId ? { contentId } : { seriesId });

  const handlePostTopLevel = (body: string) => {
    if (!postContentId || !seriesId) return Promise.resolve();
    return postComment({
      contentId: postContentId,
      contentType,
      seriesId,
      episodeNumber: contentType === "episode" ? episodeNumber ?? null : null,
      episodeTitle: contentType === "episode" ? episodeTitle ?? null : null,
      body,
    });
  };

  // Replies inherit the PARENT comment's own content-targeting fields, not
  // this section's — in hub aggregation mode, top-level comments come from
  // different episodes (or the hub itself), so a reply must stay filed
  // under whichever one its parent actually belongs to.
  const handleReply = (parent: CommentWithReplies, body: string) => {
    return postReply(parent.id, {
      contentId: parent.contentId,
      contentType: parent.contentType as "episode" | "series",
      seriesId: parent.seriesId,
      episodeNumber: parent.episodeNumber,
      episodeTitle: parent.episodeTitle,
      body,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteComment(id);
    } catch (err) {
      if (err instanceof Error && err.message === AUTH_ERROR_MESSAGE) onRequestAuth();
    }
  };

  const handleStartConversation = () => {
    if (!user) {
      onRequestAuth();
      return;
    }
    document.getElementById(composerId)?.focus();
  };

  const capped = typeof initialVisibleCount === "number" && !expanded;
  const visibleComments = capped ? comments.slice(0, initialVisibleCount) : comments;
  const hiddenCount = capped ? comments.length - visibleComments.length : 0;

  return (
    <div className={cx(styles.section, className)}>
      <div className={styles.header}>
        <h3 className={styles.countHeading}>
          {totalCount} {totalCount === 1 ? "Comment" : "Comments"}
        </h3>
        <div className={styles.sortToggle}>
          <button
            type="button"
            className={cx(styles.sortBtn, sort === "newest" && styles.sortBtnActive)}
            onClick={() => setSort("newest")}
          >
            Newest
          </button>
          <span className={styles.sortDivider}>|</span>
          <button
            type="button"
            className={cx(styles.sortBtn, sort === "top" && styles.sortBtnActive)}
            onClick={() => setSort("top")}
          >
            Top
          </button>
        </div>
      </div>

      {user ? (
        <CommentInput
          id={composerId}
          user={user}
          onRequestAuth={onRequestAuth}
          onSubmit={handlePostTopLevel}
        />
      ) : (
        <button type="button" className={styles.signInPrompt} onClick={onRequestAuth}>
          Log in to join the conversation
        </button>
      )}

      {isLoading ? (
        <div className={styles.skeleton} aria-hidden="true">
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
          <div className={styles.skeletonRow} />
        </div>
      ) : error ? (
        <p className={styles.emptyState}>{error}</p>
      ) : comments.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>
            <SpeechBubbleIcon />
          </span>
          <p className={styles.emptyText}>No comments yet.</p>
          <button type="button" className={styles.emptyNudge} onClick={handleStartConversation}>
            Start the conversation
          </button>
        </div>
      ) : (
        <>
          <div className={styles.threadList}>
            {visibleComments.map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                showEpisodeTags={showEpisodeTags}
                user={user}
                onRequestAuth={onRequestAuth}
                onReply={handleReply}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              className={styles.showMoreBtn}
              onClick={() => setExpanded(true)}
            >
              Show more comments
            </button>
          )}
        </>
      )}
    </div>
  );
}
