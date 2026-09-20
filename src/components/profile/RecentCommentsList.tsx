"use client";

import { Fragment, useEffect, useMemo } from "react";
import { useToastContext } from "@/components/ui/Toast";
import { RecentCommentItem } from "./RecentCommentItem";
import {
  useRecentComments,
  groupCommentActivity,
  type CommentActivityItem,
  type RecentCommentsCursor,
} from "@/hooks/useRecentComments";
import styles from "./RecentComments.module.css";

interface RecentCommentsListProps {
  initialItems: CommentActivityItem[];
  initialHasMore: boolean;
  initialCursor: RecentCommentsCursor | null;
  /** Reports the live post-deletion count back up to ProfileActivityFeed so it
   *  can hide this section and coordinate the shared empty state. */
  onCountChange?: (count: number) => void;
}

export function RecentCommentsList({
  initialItems,
  initialHasMore,
  initialCursor,
  onCountChange,
}: RecentCommentsListProps) {
  const toast = useToastContext();
  const { items, hasMore, loadMoreState, loadMore, deleteComment, deletingIds } = useRecentComments({
    initialItems,
    initialHasMore,
    initialCursor,
  });

  useEffect(() => {
    onCountChange?.(items.length);
  }, [items.length, onCountChange]);

  // Re-grouped on every items change (delete, load more) — cheap (no
  // fetch, just a pass over whatever's already loaded) and means a newly
  // loaded page can retroactively pair up with an already-visible parent
  // or reply from an earlier page.
  const groups = useMemo(() => groupCommentActivity(items), [items]);

  const handleDelete = async (id: string) => {
    const result = await deleteComment(id);
    if (!result.ok) {
      toast.show({ message: result.error ?? "Couldn't delete comment.", type: "error" });
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={styles.list}>
      {groups.map((group) => (
        <Fragment key={group.item.id}>
          <RecentCommentItem
            item={group.item}
            deletingIds={deletingIds}
            onDelete={handleDelete}
            ownReplies={group.ownReplies}
          />
          {group.ownReplies.map((reply) => (
            <RecentCommentItem
              key={reply.id}
              item={reply}
              deletingIds={deletingIds}
              onDelete={handleDelete}
              suppressParentContext
            />
          ))}
        </Fragment>
      ))}

      {hasMore && (
        <button
          type="button"
          className={styles.loadMoreBtn}
          disabled={loadMoreState === "loading"}
          onClick={loadMore}
        >
          {loadMoreState === "loading" ? "Loading…" : "Load more"}
        </button>
      )}

      {loadMoreState === "error" && (
        <div className={styles.loadMoreError}>
          <span>Couldn&apos;t load more comments.</span>
          <button type="button" className={styles.retryBtn} onClick={loadMore}>
            Try again
          </button>
        </div>
      )}

      {!hasMore && items.length > initialItems.length && (
        <p className={styles.endOfList}>You&apos;ve reached the end.</p>
      )}
    </div>
  );
}
