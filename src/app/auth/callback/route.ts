import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";

/**
 * Shared callback for Google OAuth, email confirmation (signup), and the
 * password-reset link — all three use Supabase's PKCE flow, which lands
 * here with a `?code=` to exchange for a session. `redirect` carries the
 * original destination (validated as an internal path only).
 *
 * Every one of those flows can leave a brand-new user without a complete
 * profile row filled in from OAuth metadata (Google) or needs the reader
 * to land somewhere other than raw JSON — so instead of redirecting
 * straight to `next`, this hands off to /auth/complete-profile-check,
 * which fires the idempotent complete-profile API and only then continues
 * on to `next`. See that page for why one hop covers both flows.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("redirect"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(
        `${origin}/auth/complete-profile-check?redirect=${encodeURIComponent(next)}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/signin?error=auth`);
}
