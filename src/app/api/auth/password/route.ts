import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/getUser";

/**
 * Updates the signed-in user's password from the Edit Profile page's
 * Password section. Requires the current password as a check — Supabase
 * has no direct "verify current password" call, so this signs in with it
 * (against the user's own email) as the verification step before calling
 * updateUser with the new one.
 */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword ?? "");
  const newPassword = String(body.newPassword ?? "");

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (verifyError) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
  if (updateError) {
    return NextResponse.json(
      { error: "Something went wrong updating your password. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
