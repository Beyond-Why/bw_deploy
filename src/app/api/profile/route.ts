import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/getUser";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { USERNAME_PATTERN } from "@/lib/auth/username";

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = String(body.username ?? "").trim().toLowerCase();
  const displayName = String(body.displayName ?? "").trim();
  const bio = String(body.bio ?? "").trim();

  if (!USERNAME_PATTERN.test(username)) {
    return NextResponse.json(
      {
        error:
          "Usernames must be 3–30 characters: lowercase letters, numbers, dots, underscores, or hyphens, and can't start or end with a separator.",
      },
      { status: 400 }
    );
  }

  if (bio.length > 500) {
    return NextResponse.json({ error: "Bio must be 500 characters or fewer." }, { status: 400 });
  }

  try {
    // Authorized above and reinforced by RLS ("Users can update their own
    // profile", auth.uid() = id) — see src/lib/db/schema.ts.
    const [updated] = await db
      .update(profiles)
      .set({
        username,
        displayName: displayName || null,
        bio: bio || null,
      })
      .where(eq(profiles.id, user.id))
      .returning();

    return NextResponse.json({ profile: updated });
  } catch (error) {
    const code = (error as { code?: string })?.code;
    if (code === "23505") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Something went wrong updating your profile. Please try again." },
      { status: 500 }
    );
  }
}
