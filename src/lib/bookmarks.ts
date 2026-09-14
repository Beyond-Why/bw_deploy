import "server-only";

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookmarks } from "@/lib/db/schema";

export type BookmarkRow = typeof bookmarks.$inferSelect;

export interface BookmarkState {
  count: number;
  bookmarked: boolean;
}

export interface BookmarkMetadata {
  contentTitle: string;
  contentUrl: string;
  seriesTitle?: string | null;
  seriesSlug?: string | null;
  episodeNumber?: number | null;
  thumbnailUrl?: string | null;
  /** Insight collections only — the card the user was on when they
   *  bookmarked, so the profile's saved-collection carousel can resume there. */
  activeCardIndex?: number | null;
  /** Episodes/series only — the series' category/subject (e.g. "Foundation
   *  & Reality"), separate from seriesTitle so a bookmark card can show
   *  both without repeating the series name. */
  contentCategory?: string | null;
}

export async function getBookmarkCount(contentId: string, contentType: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(bookmarks)
    .where(and(eq(bookmarks.contentId, contentId), eq(bookmarks.contentType, contentType)));
  return row?.value ?? 0;
}

export async function getUserBookmark(
  userId: string,
  contentId: string,
  contentType: string
): Promise<BookmarkRow | null> {
  const [row] = await db
    .select()
    .from(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.contentId, contentId),
        eq(bookmarks.contentType, contentType)
      )
    )
    .limit(1);
  return row ?? null;
}

/** Combined read used by both the API route (GET) and server-rendered pages. */
export async function getBookmarkState(
  userId: string | null,
  contentId: string,
  contentType: string
): Promise<BookmarkState> {
  const [bookmarkCount, existing] = await Promise.all([
    getBookmarkCount(contentId, contentType),
    userId ? getUserBookmark(userId, contentId, contentType) : Promise.resolve(null),
  ]);
  return { count: bookmarkCount, bookmarked: !!existing };
}

/** Toggles the current user's bookmark and returns the resulting state. */
export async function toggleBookmark(
  userId: string,
  contentId: string,
  contentType: string,
  metadata: BookmarkMetadata
): Promise<BookmarkState> {
  const existing = await getUserBookmark(userId, contentId, contentType);

  if (existing) {
    await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.contentId, contentId),
          eq(bookmarks.contentType, contentType)
        )
      );
  } else {
    await db
      .insert(bookmarks)
      .values({
        userId,
        contentId,
        contentType,
        contentTitle: metadata.contentTitle,
        contentUrl: metadata.contentUrl,
        seriesTitle: metadata.seriesTitle ?? null,
        seriesSlug: metadata.seriesSlug ?? null,
        episodeNumber: metadata.episodeNumber ?? null,
        thumbnailUrl: metadata.thumbnailUrl ?? null,
        activeCardIndex: metadata.activeCardIndex ?? 0,
        contentCategory: metadata.contentCategory ?? null,
      })
      .onConflictDoNothing();
  }

  const bookmarkCount = await getBookmarkCount(contentId, contentType);
  return { count: bookmarkCount, bookmarked: !existing };
}

/** All of a user's saved bookmarks, most recent first — used by the profile page. */
export async function getUserBookmarks(userId: string): Promise<BookmarkRow[]> {
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

/** Silently repoints an already-bookmarked insight collection at the card
 *  the user has since scrolled to — called from the reader, debounced. */
export async function updateActiveCardIndex(
  userId: string,
  contentId: string,
  contentType: string,
  activeCardIndex: number
): Promise<void> {
  await db
    .update(bookmarks)
    .set({ activeCardIndex })
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.contentId, contentId),
        eq(bookmarks.contentType, contentType)
      )
    );
}

export async function removeBookmark(
  userId: string,
  contentId: string,
  contentType: string
): Promise<void> {
  await db
    .delete(bookmarks)
    .where(
      and(
        eq(bookmarks.userId, userId),
        eq(bookmarks.contentId, contentId),
        eq(bookmarks.contentType, contentType)
      )
    );
}
