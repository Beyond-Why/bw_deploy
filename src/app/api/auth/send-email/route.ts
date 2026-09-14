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
 * Supabase Auth "send email" hook — configured in the Supabase dashboard
 * to call this instead of Supabase's built-in email sender, so every auth
 * email goes through Resend with the Beyond Why template.
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_HOOK_SECRET}`;
  if (!authHeader || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as SupabaseHookPayload | null;
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

  const actionUrl = new URL("/auth/confirm", email_data.site_url);
  actionUrl.searchParams.set("token_hash", email_data.token_hash);
  actionUrl.searchParams.set("type", email_data.email_action_type);
  if (email_data.redirect_to) {
    actionUrl.searchParams.set("next", email_data.redirect_to);
  }

  try {
    await sendAuthEmail({ to: user.email, type, actionUrl: actionUrl.toString() });
  } catch (error) {
    console.error("Failed to send auth email:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
