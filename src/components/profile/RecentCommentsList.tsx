"use client";

import { useToastContext } from "@/components/ui/Toast";
import { ChatBubbleIcon } from "@/components/icons";
import { EmptyState } from "./EmptyState";
import { RecentCommentItem } from "./RecentCommentItem";
import {
  useRecentComments,
  type CommentActivityItem,
  type RecentCommentsCursor,
} from "@/hooks/useRecentComments";
import styles from "./RecentComments.module.css";

interface RecentCommentsListProps {
  initialItems: CommentActivityItem[];
  initialHasMore: boolean;
  initialCursor: RecentCommentsCursor | null;
}

export function RecentCommentsList({
  initialItems,
  initialHasMore,
  initialCursor,
}: RecentCommentsListProps) {
  const toast = useToastContext();
  const { items, hasMore, loadMoreState, loadMore, deleteComment, deletingIds } = useRecentComments({
    initialItems,
    initialHasMore,
    initialCursor,
  });

  const handleDelete = async (id: string) => {
    const result = await deleteComment(id);
    if (!result.ok) {
      toast.show({ message: result.error ?? "Couldn't delete comment.", type: "error" });
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ChatBubbleIcon size={32} />}
        message="No comments yet."
        subMessage="Join a discussion and your comments will appear here."
        ctaLabel="Explore Deep Dives →"
        ctaHref="/deep-dives"
        variant="section"
      />
    );
  }

  return (
    <div className={styles.list}>
      {items.map((item) => (
        <RecentCommentItem
          key={item.id}
          item={item}
          deleting={deletingIds.has(item.id)}
          onDelete={handleDelete}
        />
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
