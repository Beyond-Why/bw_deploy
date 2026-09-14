import "server-only";

import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, profiles } from "@/lib/db/schema";

export type NotificationRow = typeof notifications.$inferSelect;
export type NotificationType = (typeof notifications.type.enumValues)[number];

export async function getNotifications(userId: string, limit = 20): Promise<NotificationRow[]> {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
  return Number(row?.value ?? 0);
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
}

export async function markOneRead(userId: string, id: string): Promise<void> {
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.id, id)));
}

/** Fans a notification out to every profile — used by the admin broadcast
 *  route only (POST /api/admin/notifications). */
export async function broadcastNotification(input: {
  type: NotificationType;
  title: string;
  body: string;
  contentUrl: string;
}): Promise<number> {
  const recipients = await db.select({ id: profiles.id }).from(profiles);
  if (recipients.length === 0) return 0;

  await db.insert(notifications).values(
    recipients.map((r) => ({
      userId: r.id,
      type: input.type,
      title: input.title,
      body: input.body,
      contentUrl: input.contentUrl,
    }))
  );

  return recipients.length;
}
