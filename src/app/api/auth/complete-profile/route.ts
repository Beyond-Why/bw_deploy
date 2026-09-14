import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/getUser";
import { generateUsername } from "@/lib/auth/generateUsername";

/**
 * Called once, right after any sign-in flow lands with a session (see
 * /auth/complete-profile-check) — idempotent, so calling it again for an
 * already-complete profile is just a cheap no-op read.
 *
 * In the normal case this finds a profile already sitting there: the
 * handle_new_user DB trigger creates one atomically the moment
 * auth.users gets a new row, for both password signup (using the
 * username generated client-side and passed through user_metadata) and
 * Google OAuth (falling back to an email-derived username, since Google
 * sign-in never goes through the signup form that generates one). The
 * insert below only matters as a defensive fallback — e.g. a request
 * racing the trigger, or a future auth path that bypasses it.
 */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (existing) {
    return NextResponse.json({ ok: true, alreadyComplete: true });
  }

  const metadata = user.user_metadata ?? {};
  const fullName =
    (metadata.full_name as string | undefined) ||
    (metadata.name as string | undefined) ||
    null;
  const username =
    (metadata.username as string | undefined) ||
    generateUsername(fullName || user.email || "user");

  await db
    .insert(profiles)
    .values({
      id: user.id,
      username,
      displayName: fullName,
      email: user.email ?? null,
    })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}
