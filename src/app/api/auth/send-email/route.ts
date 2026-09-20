import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import type { AuthEmailType } from "@/lib/email/templates/auth-email";
import { normalizeRedirectTo } from "@/lib/auth/redirect";

interface SupabaseHookPayload {
  user: { email: string };
  email_data: {
    email_action_type: string;
    token_hash: string;
    site_url: string;
    redirect_to?: string;
  };
}

const ACTION_TYPE_MAP: Record<string, AuthEmailType> = {
  signup: "confirm",
  email: "confirm",
  invite: "confirm",
  magiclink: "magic-link",
  recovery: "reset-password",
  email_change: "change-email",
};

/**
 * Supabase Auth "send email" hook — configured in the Supabase dashboard
 * to call this instead of Supabase's built-in email sender, so every auth
 * email goes through Resend with the Beyond Why template.
 *
 * Supabase signs these requests per the Standard Webhooks spec (the
 * `webhook-id` / `webhook-signature` / `webhook-timestamp` headers, not
 * `authorization`) — verified manually below (HMAC-SHA256 over
 * `{id}.{timestamp}.{body}`, constant-time compared, with the same
 * +/-5min timestamp tolerance the spec requires) rather than via the
 * `standardwebhooks` package.
 */

// Standard Webhooks' own default replay-protection window.
const WEBHOOK_TOLERANCE_SECONDS = 5 * 60;

export async function POST(request: Request) {
  const rawBody = await request.text();

  // The dashboard-generated secret is `v1,whsec_<base64>` — strip
  // both prefixes to get the raw base64 secret.
  const secret = (process.env.SUPABASE_HOOK_SECRET ?? "").replace(/^v1,whsec_/, "");
  const keyBytes = Buffer.from(secret, "base64");

  const webhookId = request.headers.get("webhook-id") ?? "";
  const webhookTimestamp = request.headers.get("webhook-timestamp") ?? "";
  const webhookSignature = request.headers.get("webhook-signature") ?? "";

  const verificationError = (() => {
    // Reject a missing/malformed/stale-or-future timestamp before even
    // computing the HMAC — this is what actually stops a captured
    // request from being replayed later; the signature alone doesn't,
    // since it covers the timestamp's *value*, not its age.
    const tsSeconds = Number(webhookTimestamp);
    if (!Number.isFinite(tsSeconds)) return "missing or invalid webhook-timestamp";
    if (Math.abs(Date.now() / 1000 - tsSeconds) > WEBHOOK_TOLERANCE_SECONDS) {
      return "webhook-timestamp outside tolerance";
    }

    const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;
    const computedSig = createHmac("sha256", keyBytes).update(signedContent).digest();

    // webhook-signature can carry multiple space-separated "v1,<sig>"
    // values (key rotation) — valid if any one matches. Buffer.compare
    // via timingSafeEqual (not string/array .includes) so a mismatch
    // can't be distinguished by how quickly it fails.
    const expectedSigs = webhookSignature.split(" ").map((s) => s.replace(/^v1,/, ""));
    const matches = expectedSigs.some((sig) => {
      let sigBytes: Buffer;
      try {
        sigBytes = Buffer.from(sig, "base64");
      } catch {
        return false;
      }
      return sigBytes.length === computedSig.length && timingSafeEqual(sigBytes, computedSig);
    });

    return matches ? null : "signature mismatch";
  })();

  if (verificationError) {
    // TEMPORARY DEBUG — remove once the signup 500 is root-caused.
    console.error("verify failed:", {
      error: verificationError,
      secretLength: secret.length,
      bodyLength: rawBody.length,
      webhookId: request.headers.get("webhook-id"),
      webhookTimestamp: request.headers.get("webhook-timestamp"),
      sigHeader: request.headers.get("webhook-signature")?.slice(0, 20),
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (() => {
    try {
      return JSON.parse(rawBody) as SupabaseHookPayload;
    } catch {
      return null;
    }
  })();
  if (!payload?.user?.email || !payload?.email_data?.token_hash) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { user, email_data } = payload;
  const type = ACTION_TYPE_MAP[email_data.email_action_type];
  if (!type) {
    return NextResponse.json(
      { error: `Unsupported email_action_type: ${email_data.email_action_type}` },
      { status: 400 }
    );
  }

  const actionUrl = new URL("/auth/confirm", request.url);
  actionUrl.searchParams.set("token_hash", email_data.token_hash);
  actionUrl.searchParams.set("type", email_data.email_action_type);
  const normalizedNext = normalizeRedirectTo(email_data.redirect_to, request.url);
  if (normalizedNext) {
    actionUrl.searchParams.set("next", normalizedNext);
  }

  try {
    await sendAuthEmail({ to: user.email, type, actionUrl: actionUrl.toString() });
  } catch (error) {
    console.error("Failed to send auth email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
