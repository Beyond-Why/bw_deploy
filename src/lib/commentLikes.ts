import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { commentLikes } from "@/lib/db/schema";

/** Batch like data for a set of comments — one count query + one
 *  "did the viewer like these" query, regardless of how many comments are
 *  in the thread (avoids an N+1 per comment). */
export async function getCommentLikeData(
  commentIds: string[],
  viewerUserId: string | null
): Promise<{ counts: Map<string, number>; likedByViewer: Set<string> }> {
  if (commentIds.length === 0) {
    return { counts: new Map(), likedByViewer: new Set() };
  }

  const countRows = await db
    .select({ commentId: commentLikes.commentId, value: count() })
    .from(commentLikes)
    .where(inArray(commentLikes.commentId, commentIds))
    .groupBy(commentLikes.commentId);
  const counts = new Map(countRows.map((r) => [r.commentId, r.value]));

  let likedByViewer = new Set<string>();
  if (viewerUserId) {
    const likedRows = await db
      .select({ commentId: commentLikes.commentId })
      .from(commentLikes)
      .where(
        and(eq(commentLikes.userId, viewerUserId), inArray(commentLikes.commentId, commentIds))
      );
    likedByViewer = new Set(likedRows.map((r) => r.commentId));
  }

  return { counts, likedByViewer };
}

async function getCommentLikeCount(commentId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(commentLikes)
    .where(eq(commentLikes.commentId, commentId));
  return row?.value ?? 0;
}

export async function likeComment(commentId: string, userId: string): Promise<number> {
  await db.insert(commentLikes).values({ commentId, userId }).onConflictDoNothing();
  return getCommentLikeCount(commentId);
}

export async function unlikeComment(commentId: string, userId: string): Promise<number> {
  await db
    .delete(commentLikes)
    .where(and(eq(commentLikes.commentId, commentId), eq(commentLikes.userId, userId)));
  return getCommentLikeCount(commentId);
}
