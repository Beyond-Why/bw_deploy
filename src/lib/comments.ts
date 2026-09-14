import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments } from "@/lib/db/schema";
import { getCommentLikeData } from "@/lib/commentLikes";

export type CommentRow = typeof comments.$inferSelect;

export interface CommentData {
  id: string;
  userId: string;
  userHandle: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  contentId: string;
  contentType: string;
  seriesId: string;
  episodeNumber: string | null;
  episodeTitle: string | null;
  parentId: string | null;
  body: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  likedByMe: boolean;
}

export interface CommentWithReplies extends CommentData {
  replies: CommentData[];
}

export type CommentSort = "newest" | "top";

export interface CreateCommentParams {
  userId: string;
  userHandle: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  contentId: string;
  contentType: string;
  seriesId: string;
  episodeNumber?: string | null;
  episodeTitle?: string | null;
  parentId?: string | null;
  body: string;
}

/** Soft-deleted comments keep their row (thread structure + reply counts
 *  stay accurate) but redact everything the author wrote/was. */
function serializeComment(
  row: CommentRow,
  likeCount: number,
  likedByMe: boolean
): CommentData {
  return {
    id: row.id,
    userId: row.userId,
    userHandle: row.userHandle,
    userDisplayName: row.isDeleted ? "Deleted" : row.userDisplayName,
    userAvatarUrl: row.isDeleted ? null : row.userAvatarUrl,
    contentId: row.contentId,
    contentType: row.contentType,
    seriesId: row.seriesId,
    episodeNumber: row.episodeNumber,
    episodeTitle: row.episodeTitle,
    parentId: row.parentId,
    body: row.isDeleted ? "[deleted]" : row.body,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    likeCount,
    likedByMe,
  };
}

/** Builds top-level comments (with nested replies) from a flat row set —
 *  one query, no N+1, since a single episode/series thread is never large
 *  enough to need pagination or SQL-side aggregation. Like counts are
 *  fetched in one batched follow-up query for every comment id involved. */
async function buildThreads(
  rows: CommentRow[],
  sort: CommentSort,
  viewerUserId: string | null
): Promise<CommentWithReplies[]> {
  const topLevel: CommentRow[] = [];
  const repliesByParent = new Map<string, CommentRow[]>();

  for (const row of rows) {
    if (row.parentId) {
      const list = repliesByParent.get(row.parentId);
      if (list) list.push(row);
      else repliesByParent.set(row.parentId, [row]);
    } else {
      topLevel.push(row);
    }
  }

  for (const list of repliesByParent.values()) {
    list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  const sortedTop = [...topLevel].sort((a, b) => {
    if (sort === "top") {
      const replyDiff =
        (repliesByParent.get(b.id)?.length ?? 0) - (repliesByParent.get(a.id)?.length ?? 0);
      if (replyDiff !== 0) return replyDiff;
    }
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  const { counts, likedByViewer } = await getCommentLikeData(
    rows.map((r) => r.id),
    viewerUserId
  );
  const toData = (row: CommentRow) =>
    serializeComment(row, counts.get(row.id) ?? 0, likedByViewer.has(row.id));

  return sortedTop.map((row) => ({
    ...toData(row),
    replies: (repliesByParent.get(row.id) ?? []).map(toData),
  }));
}

/** Batch comment counts (top-level + replies, soft-deleted excluded) for a
 *  set of content ids of one type — one grouped query, not one per id
 *  (used by the hub page's episode-row engagement counts). */
export async function getCommentCountsByContentIds(
  contentIds: string[],
  contentType: string
): Promise<Map<string, number>> {
  if (contentIds.length === 0) return new Map();
  const rows = await db
    .select({ contentId: comments.contentId, value: count() })
    .from(comments)
    .where(
      and(
        eq(comments.contentType, contentType),
        eq(comments.isDeleted, false),
        inArray(comments.contentId, contentIds)
      )
    )
    .groupBy(comments.contentId);
  return new Map(rows.map((r) => [r.contentId, r.value]));
}

/** Episode/hub thread — every comment (top-level + replies) for one contentId. */
export async function getCommentsForContent(
  contentId: string,
  sort: CommentSort,
  viewerUserId: string | null
): Promise<CommentWithReplies[]> {
  const rows = await db.select().from(comments).where(eq(comments.contentId, contentId));
  return buildThreads(rows, sort, viewerUserId);
}

/** Hub aggregation — every comment across every episode in a series, plus
 *  the series' own hub-level thread. */
export async function getCommentsForSeries(
  seriesId: string,
  sort: CommentSort,
  viewerUserId: string | null
): Promise<CommentWithReplies[]> {
  const rows = await db.select().from(comments).where(eq(comments.seriesId, seriesId));
  return buildThreads(rows, sort, viewerUserId);
}

export async function createComment(params: CreateCommentParams): Promise<CommentData> {
  const [row] = await db
    .insert(comments)
    .values({
      userId: params.userId,
      userHandle: params.userHandle,
      userDisplayName: params.userDisplayName,
      userAvatarUrl: params.userAvatarUrl,
      contentId: params.contentId,
      contentType: params.contentType,
      seriesId: params.seriesId,
      episodeNumber: params.episodeNumber ?? null,
      episodeTitle: params.episodeTitle ?? null,
      parentId: params.parentId ?? null,
      body: params.body,
    })
    .returning();
  return serializeComment(row, 0, false);
}

/** Soft delete only, owner-gated. Returns false if the comment doesn't
 *  exist or isn't owned by this user (nothing to distinguish the two —
 *  the caller treats both as a 404). */
export async function softDeleteComment(id: string, userId: string): Promise<boolean> {
  const [row] = await db
    .update(comments)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(and(eq(comments.id, id), eq(comments.userId, userId)))
    .returning({ id: comments.id });
  return !!row;
}
