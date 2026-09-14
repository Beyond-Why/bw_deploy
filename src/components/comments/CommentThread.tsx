"use client";

import { useState } from "react";
import type { CommentWithReplies } from "@/hooks/useComments";
import { CommentItem } from "./CommentItem";
import { CommentInput } from "./CommentInput";
import type { CurrentUser } from "./CommentSection";
import styles from "./CommentSection.module.css";

interface CommentThreadProps {
  comment: CommentWithReplies;
  showEpisodeTags: boolean;
  user: CurrentUser | null;
  onRequestAuth: () => void;
  onReply: (parent: CommentWithReplies, body: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
}

export function CommentThread({
  comment,
  showEpisodeTags,
  user,
  onRequestAuth,
  onReply,
  onDelete,
}: CommentThreadProps) {
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyBoxOpen, setReplyBoxOpen] = useState(false);
  const replyCount = comment.replies.length;

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

  return (
    <div className={styles.thread}>
      <CommentItem
        comment={comment}
        showEpisodeTag={showEpisodeTags}
        isOwner={!!user && user.id === comment.userId}
        isAuthenticated={!!user}
        onRequestAuth={onRequestAuth}
        onReplyClick={handleReplyClick}
        onDelete={() => onDelete(comment.id)}
      />

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
    </div>
  );
}
