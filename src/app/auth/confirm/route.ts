import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/auth/redirect";

/**
 * Landing route for the token_hash-based auth emails sent via the
 * Resend hook (/api/auth/send-email) — signup confirmation, magic link,
 * password reset, and email change. Distinct from /auth/callback, which
 * handles the PKCE `?code=` flow (OAuth).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeRedirectPath(searchParams.get("next"));

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/auth/error?message=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(
    `${origin}/auth/error?message=${encodeURIComponent("Missing or invalid confirmation link.")}`
  );
}
