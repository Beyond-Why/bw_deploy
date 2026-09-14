import "server-only";

import { and, count, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { likes } from "@/lib/db/schema";

export interface LikeState {
  count: number;
  liked: boolean;
}

/** Batch like counts for a set of content ids of one type — one grouped
 *  query, not one per id (used by the hub page's episode-row engagement
 *  counts, which would otherwise be an N+1 across every episode). */
export async function getLikeCountsByContentIds(
  contentIds: string[],
  contentType: string
): Promise<Map<string, number>> {
  if (contentIds.length === 0) return new Map();
  const rows = await db
    .select({ contentId: likes.contentId, value: count() })
    .from(likes)
    .where(and(eq(likes.contentType, contentType), inArray(likes.contentId, contentIds)))
    .groupBy(likes.contentId);
  return new Map(rows.map((r) => [r.contentId, r.value]));
}

export async function getLikeCount(contentId: string, contentType: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(likes)
    .where(and(eq(likes.contentId, contentId), eq(likes.contentType, contentType)));
  return row?.value ?? 0;
}

async function isLikedByUser(
  userId: string,
  contentId: string,
  contentType: string
): Promise<boolean> {
  const [row] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(
      and(
        eq(likes.userId, userId),
        eq(likes.contentId, contentId),
        eq(likes.contentType, contentType)
      )
    )
    .limit(1);
  return !!row;
}

/** Combined read used by both the API route (GET) and server-rendered pages. */
export async function getLikeState(
  userId: string | null,
  contentId: string,
  contentType: string
): Promise<LikeState> {
  const [likeCount, liked] = await Promise.all([
    getLikeCount(contentId, contentType),
    userId ? isLikedByUser(userId, contentId, contentType) : Promise.resolve(false),
  ]);
  return { count: likeCount, liked };
}

/** Toggles the current user's like and returns the resulting state. */
export async function toggleLike(
  userId: string,
  contentId: string,
  contentType: string
): Promise<LikeState> {
  const alreadyLiked = await isLikedByUser(userId, contentId, contentType);

  if (alreadyLiked) {
    await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.contentId, contentId),
          eq(likes.contentType, contentType)
        )
      );
  } else {
    await db
      .insert(likes)
      .values({ userId, contentId, contentType })
      .onConflictDoNothing();
  }

  const likeCount = await getLikeCount(contentId, contentType);
  return { count: likeCount, liked: !alreadyLiked };
}
