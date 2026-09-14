import "server-only";

import { Resend } from "resend";
import { buildAuthEmail, type AuthEmailType } from "@/lib/email/templates/auth-email";

export interface SendAuthEmailParams {
  to: string;
  type: AuthEmailType;
  actionUrl: string;
}

export async function sendAuthEmail({ to, type, actionUrl }: SendAuthEmailParams): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { subject, html, text } = buildAuthEmail({ type, actionUrl, userEmail: to });

  const { error } = await resend.emails.send({
    from: "Beyond Why <auth@beyondwhy.org>",
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(`Failed to send ${type} auth email to ${to}: ${error.message}`);
  }
}
