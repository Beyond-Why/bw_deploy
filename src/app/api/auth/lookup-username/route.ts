import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * Resolves a username to its account email, for the sign-in form's
 * "email or username" field — when the identifier isn't an email, it
 * retries supabase.auth.signInWithPassword with whatever this returns.
 *
 * Reads profiles.email directly (kept in sync by the handle_new_user
 * trigger at signup) rather than a service-role admin lookup — no
 * SUPABASE_SERVICE_ROLE_KEY needed for this route.
 */
export async function POST(request: Request) {
  let body: { username?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  if (!username) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // `username` is citext — this comparison is already case-insensitive
  // at the database level.
  const [profile] = await db
    .select({ email: profiles.email })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  if (!profile?.email) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ email: profile.email });
}
