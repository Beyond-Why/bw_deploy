import "server-only";

import { and, asc, count, desc, eq, inArray, lt, or } from "drizzle-orm";
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

export interface RecentCommentParent {
  id: string;
  userDisplayName: string;
  body: string;
  isDeleted: boolean;
}

/** One row of the profile "Recent Comments" activity list — either a
 *  top-level comment the user posted (parent is null, replyCount is
 *  whatever anyone has replied with) or a reply the user posted (parent is
 *  the comment they replied to, replyCount is always 0). */
export interface RecentComment {
  id: string;
  userDisplayName: string;
  userAvatarUrl: string | null;
  contentId: string;
  contentType: string;
  seriesId: string;
  episodeNumber: string | null;
  episodeTitle: string | null;
  body: string;
  createdAt: string;
  parentId: string | null;
  parent: RecentCommentParent | null;
  replyCount: number;
}

export interface RecentCommentsCursor {
  createdAt: string;
  id: string;
}

export interface RecentCommentsPage {
  items: RecentComment[];
  nextCursor: RecentCommentsCursor | null;
  hasMore: boolean;
}

/** One page of a user's own comment activity — top-level comments and
 *  replies they authored, soft-deleted excluded, newest first. Keyset
 *  paginated on (createdAt, id) rather than offset, so a "Load more" click
 *  can't skip or duplicate rows if a new comment lands in between pages.
 *  Powers the profile's Recent Comments section. */
export async function getRecentCommentsForUser(
  userId: string,
  limit: number,
  cursor?: RecentCommentsCursor
): Promise<RecentCommentsPage> {
  const conditions = [eq(comments.userId, userId), eq(comments.isDeleted, false)];
  if (cursor) {
    const cursorDate = new Date(cursor.createdAt);
    const cursorCondition = or(
      lt(comments.createdAt, cursorDate),
      and(eq(comments.createdAt, cursorDate), lt(comments.id, cursor.id))
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select()
    .from(comments)
    .where(and(...conditions))
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit);

  // A reply needs its parent's author/text for context; a top-level
  // comment needs a reply count — both batched across the whole page
  // rather than queried per row (same pattern as buildThreads' like fetch).
  const parentIds = [...new Set(page.filter((r) => r.parentId).map((r) => r.parentId as string))];
  const topLevelIds = page.filter((r) => !r.parentId).map((r) => r.id);

  const [parentRows, replyCountRows] = await Promise.all([
    parentIds.length
      ? db.select().from(comments).where(inArray(comments.id, parentIds))
      : Promise.resolve([] as CommentRow[]),
    topLevelIds.length
      ? db
          .select({ parentId: comments.parentId, value: count() })
          .from(comments)
          .where(inArray(comments.parentId, topLevelIds))
          .groupBy(comments.parentId)
      : Promise.resolve([] as { parentId: string | null; value: number }[]),
  ]);

  const parentsById = new Map(parentRows.map((r) => [r.id, r]));
  const replyCountByParent = new Map(replyCountRows.map((r) => [r.parentId as string, r.value]));

  const items: RecentComment[] = page.map((row) => {
    const parentRow = row.parentId ? parentsById.get(row.parentId) ?? null : null;
    return {
      id: row.id,
      userDisplayName: row.userDisplayName,
      userAvatarUrl: row.userAvatarUrl,
      contentId: row.contentId,
      contentType: row.contentType,
      seriesId: row.seriesId,
      episodeNumber: row.episodeNumber,
      episodeTitle: row.episodeTitle,
      body: row.body,
      createdAt: row.createdAt.toISOString(),
      parentId: row.parentId,
      parent: parentRow
        ? {
            id: parentRow.id,
            userDisplayName: parentRow.isDeleted ? "Deleted" : parentRow.userDisplayName,
            body: parentRow.isDeleted ? "[deleted]" : parentRow.body,
            isDeleted: parentRow.isDeleted,
          }
        : null,
      replyCount: row.parentId ? 0 : replyCountByParent.get(row.id) ?? 0,
    };
  });

  const last = page[page.length - 1];
  const nextCursor =
    hasMore && last ? { createdAt: last.createdAt.toISOString(), id: last.id } : null;

  return { items, nextCursor, hasMore };
}

/** A single comment's direct replies, from any author — soft-deleted ones
 *  included and redacted, same convention as the main discussion thread —
 *  oldest first. Used to expand one of the profile owner's top-level
 *  comments without re-fetching the whole page/thread it lives on. */
export async function getRepliesForComment(
  parentId: string,
  viewerUserId: string | null = null
): Promise<CommentData[]> {
  const rows = await db
    .select()
    .from(comments)
    .where(eq(comments.parentId, parentId))
    .orderBy(asc(comments.createdAt));
  const { counts, likedByViewer } = await getCommentLikeData(rows.map((r) => r.id), viewerUserId);
  return rows.map((row) => serializeComment(row, counts.get(row.id) ?? 0, likedByViewer.has(row.id)));
}
