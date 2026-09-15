import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { isValidUsername } from "@/lib/auth/username";

/**
 * Availability check for the signup form's username field — called
 * debounced as the user types. `username` is citext, so this comparison
 * is already case-insensitive at the database level.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") ?? "").trim().toLowerCase();

  if (!isValidUsername(username)) {
    return NextResponse.json({ available: false, reason: "invalid" });
  }

  const [existing] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.username, username))
    .limit(1);

  return NextResponse.json({ available: !existing, reason: existing ? "taken" : null });
}
