import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { sendAuthEmail } from "@/lib/email/send-auth-email";
import type { AuthEmailType } from "@/lib/email/templates/auth-email";

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
 * Verifies a Supabase Auth Hook request signature.
 *
 * Supabase signs webhook requests per the "standardwebhooks" spec: the
 * Authorization header carries `Bearer v1,t=<timestamp>,v1=<signature>`,
 * and the signature is HMAC-SHA256 over `${timestamp}.${rawBody}` using
 * the raw bytes of the base64-encoded secret in SUPABASE_HOOK_SECRET
 * (format `v1,whsec_<base64>`).
 */
function verifyHookSignature(authHeader: string | null, rawBody: string): boolean {
  const hookSecret = process.env.SUPABASE_HOOK_SECRET;
  if (!authHeader || !hookSecret) return false;

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/);
  if (!bearerMatch) return false;

  const parts = Object.fromEntries(
    bearerMatch[1].split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key, rest.join("=")];
    })
  );
  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  const secretMatch = hookSecret.match(/^v1,whsec_(.+)$/);
  if (!secretMatch) return false;
  const signingKey = Buffer.from(secretMatch[1], "base64");

  const expectedSignature = createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const expectedBuf = Buffer.from(expectedSignature, "hex");
  const actualBuf = Buffer.from(signature, "hex");
  if (expectedBuf.length !== actualBuf.length) return false;

  return timingSafeEqual(expectedBuf, actualBuf);
}

/**
 * Supabase Auth "send email" hook — configured in the Supabase dashboard
 * to call this instead of Supabase's built-in email sender, so every auth
 * email goes through Resend with the Beyond Why template.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();

  const authHeader = request.headers.get("authorization");
  if (!verifyHookSignature(authHeader, rawBody)) {
    console.error("send-email hook: signature verification failed", {
      hasAuthHeader: Boolean(authHeader),
      hasHookSecret: Boolean(process.env.SUPABASE_HOOK_SECRET),
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
    console.error("send-email hook: invalid payload", {
      parsedJson: payload !== null,
      hasUserEmail: Boolean(payload?.user?.email),
      hasTokenHash: Boolean(payload?.email_data?.token_hash),
    });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { user, email_data } = payload;
  const type = ACTION_TYPE_MAP[email_data.email_action_type];
  if (!type) {
    console.error("send-email hook: unsupported email_action_type", {
      email_action_type: email_data.email_action_type,
    });
    return NextResponse.json(
      { error: `Unsupported email_action_type: ${email_data.email_action_type}` },
      { status: 400 }
    );
  }

  // TEMPORARY DEBUG — remove once the signup 500 is root-caused.
  console.log(
    "hook reached, action:",
    email_data.email_action_type,
    "email:",
    user.email.slice(0, 4) + "..."
  );

  const actionUrl = new URL("/auth/confirm", email_data.site_url);
  actionUrl.searchParams.set("token_hash", email_data.token_hash);
  actionUrl.searchParams.set("type", email_data.email_action_type);
  if (email_data.redirect_to) {
    actionUrl.searchParams.set("next", email_data.redirect_to);
  }

  try {
    await sendAuthEmail({ to: user.email, type, actionUrl: actionUrl.toString() });
    // TEMPORARY DEBUG — remove once the signup 500 is root-caused.
    console.log("resend success");
  } catch (error) {
    console.error("Failed to send auth email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
