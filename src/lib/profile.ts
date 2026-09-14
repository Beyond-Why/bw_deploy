import "server-only";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

export type Profile = typeof profiles.$inferSelect;

/** Case-insensitive lookup — `username` is `citext`, so `=` already folds case. */
export const getProfileByUsername = cache(async (username: string) => {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);
  return profile ?? null;
});

export const getProfileById = cache(async (id: string) => {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, id)).limit(1);
  return profile ?? null;
});

/** Updates the signed-in user's avatar_url after a successful Storage upload. */
export async function updateProfileAvatar(userId: string, avatarUrl: string): Promise<void> {
  await db.update(profiles).set({ avatarUrl }).where(eq(profiles.id, userId));
}
