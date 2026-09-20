"use client";

import { useState } from "react";
import type { CommentWithReplies } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import { ConfirmDeleteThreadModal } from "./ConfirmDeleteThreadModal";
import type { CurrentUser } from "./CommentSection";
import styles from "./CommentSection.module.css";

interface CommentThreadProps {
  comment: CommentWithReplies;
  showEpisodeTags: boolean;
  user: CurrentUser | null;
  onRequestAuth: () => void;
  onReply: (parent: CommentWithReplies, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  /** Deletes this comment and every reply to it — only reachable via the
   *  confirmation modal below, when at least one reply belongs to someone
   *  other than the viewer. Resolves false on failure (comment stays). */
  onDeleteThread: (id: string) => Promise<boolean>;
}

export function CommentThread({
  comment,
  showEpisodeTags,
  user,
  onRequestAuth,
  onReply,
  onDelete,
  onDeleteThread,
}: CommentThreadProps) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyBoxOpen, setReplyBoxOpen] = useState(false);
  const [confirmThreadDeleteOpen, setConfirmThreadDeleteOpen] = useState(false);
  const [deletingThread, setDeletingThread] = useState(false);
  const replyCount = comment.replies.length;

  // The viewer only ever sees this comment's own Delete button when they
  // own it (CommentItem gates on isOwner) — so "replies from other
  // people" just means any reply not authored by the viewer themselves.
  // An already soft-deleted reply doesn't count — there's nothing live of
  // theirs left to warn about destroying. Deleting one's own comment
  // shouldn't need a special warning unless it would also take someone
  // else's still-visible content down with it.
  const hasOtherAuthorReplies = comment.replies.some(
    (reply) => !reply.isDeleted && reply.userId !== user?.id
  );

  const handleReplyClick = () => {
    if (!user) {
      onRequestAuth();
      return;
    }
    setReplyBoxOpen((open) => !open);
  };

  const handleReplySubmit = async (body: string) => {
    await onReply(comment, body);
    setReplyBoxOpen(false);
    setRepliesOpen(true);
  };

  // A comment with no replies, or replies only from the viewer themselves,
  // deletes immediately (existing single-comment path — already preserves
  // any own replies, see useComments' deleteComment). Only a reply from
  // someone else routes through the confirmation modal first.
  const handleDeleteClick = () => {
    if (hasOtherAuthorReplies) {
      setConfirmThreadDeleteOpen(true);
      return;
    }
    onDelete(comment.id);
  };

  const handleConfirmDeleteThread = async () => {
    setDeletingThread(true);
    const ok = await onDeleteThread(comment.id);
    // On success this CommentThread unmounts (the parent removed it from
    // its list), taking the modal down with it — nothing left to do here.
    if (!ok) {
      setDeletingThread(false);
    }
  };

  // A deleted top-level comment only reaches this component at all when it
  // still has replies worth keeping (see useComments' deleteComment) — so
  // instead of rendering it as a normal, owner-less "[deleted]" comment
  // card, it's replaced with a minimal notice and the replies stay put
  // underneath, still reachable via the toggle below.
  return (
    <div className={styles.thread}>
      {comment.isDeleted ? (
        <p className={styles.deletedParentNotice}>Original comment deleted</p>
      ) : (
        <CommentItem
          comment={comment}
          showEpisodeTag={showEpisodeTags}
          isOwner={!!user && user.id === comment.userId}
          isAuthenticated={!!user}
          onRequestAuth={onRequestAuth}
          onReplyClick={handleReplyClick}
          onDelete={handleDeleteClick}
        />
      )}

      <div className={styles.repliesWrap}>
        {replyBoxOpen && (
          <div className={styles.replyInputWrap}>
            <CommentInput
              user={user}
              onRequestAuth={onRequestAuth}
              onSubmit={handleReplySubmit}
              placeholder="Add a reply…"
              submitLabel="Reply"
              autoFocus
              avatarSize={26}
              onCancel={() => setReplyBoxOpen(false)}
            />
          </div>
        )}

        {replyCount > 0 && (
          <button
            type="button"
            className={styles.repliesToggle}
            onClick={() => setRepliesOpen((open) => !open)}
          >
            {repliesOpen ? "Hide replies ▴" : `${replyCount} ${replyCount === 1 ? "reply" : "replies"} ▾`}
          </button>
        )}

        {repliesOpen && replyCount > 0 && (
          <div className={styles.repliesList}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                isReply
                showEpisodeTag={showEpisodeTags}
                isOwner={!!user && user.id === reply.userId}
                isAuthenticated={!!user}
                onRequestAuth={onRequestAuth}
                onDelete={() => onDelete(reply.id)}
              />
            ))}
          </div>
        )}
      </div>

      {confirmThreadDeleteOpen && (
        <ConfirmDeleteThreadModal
          deleting={deletingThread}
          onConfirm={handleConfirmDeleteThread}
          onCancel={() => setConfirmThreadDeleteOpen(false)}
        />
      )}
    </div>
  );
}
