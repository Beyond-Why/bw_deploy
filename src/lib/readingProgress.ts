import "server-only";

import { and, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { readingProgress } from "@/lib/db/schema";

const COMPLETION_THRESHOLD = 0.8;
/** Below this, landing on a page doesn't count as "started reading". */
const CONTINUE_READING_MIN_PROGRESS = 0.05;

export type ReadingProgressRow = typeof readingProgress.$inferSelect;

export interface SaveReadingProgressInput {
  userId: string;
  contentId: string;
  contentType: string;
  seriesId?: string | null;
  scrollPercent: number;
  /** Force-complete regardless of scrollPercent, e.g. an explicit "Next episode" click. */
  completed?: boolean;
}

export async function saveReadingProgress({
  userId,
  contentId,
  contentType,
  seriesId,
  scrollPercent,
  completed,
}: SaveReadingProgressInput): Promise<void> {
  const clampedPercent = Math.min(1, Math.max(0, scrollPercent));
  const incomingCompleted = completed === true || clampedPercent >= COMPLETION_THRESHOLD;

  await db
    .insert(readingProgress)
    .values({
      userId,
      contentId,
      contentType,
      seriesId: seriesId ?? null,
      scrollPercent: clampedPercent,
      completed: incomingCompleted,
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.contentId, readingProgress.contentType],
      set: {
        scrollPercent: clampedPercent,
        seriesId: seriesId ?? null,
        lastReadAt: new Date(),
        // Sticky: once completed, stays completed even if this update's
        // percent/flag says otherwise (e.g. a later re-read from the top).
        completed: sql`${readingProgress.completed} OR ${incomingCompleted}`,
      },
    });
}

/** A single episode's saved progress, for scroll restoration. */
export async function getReadingProgress(
  userId: string,
  contentId: string,
  contentType: string
): Promise<ReadingProgressRow | null> {
  const [row] = await db
    .select()
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.contentId, contentId),
        eq(readingProgress.contentType, contentType)
      )
    )
    .limit(1);
  return row ?? null;
}

/** Incomplete, actually-started episodes for the profile Home tab's Continue Reading row. */
export async function getContinueReading(
  userId: string,
  limit = 3
): Promise<ReadingProgressRow[]> {
  return db
    .select()
    .from(readingProgress)
    .where(
      and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.completed, false),
        gt(readingProgress.scrollPercent, CONTINUE_READING_MIN_PROGRESS)
      )
    )
    .orderBy(desc(readingProgress.lastReadAt))
    .limit(limit);
}
