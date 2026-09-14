export type AuthEmailType = "confirm" | "magic-link" | "reset-password" | "change-email";

export interface BuildAuthEmailParams {
  type: AuthEmailType;
  actionUrl: string;
  userEmail: string;
}

export interface BuiltAuthEmail {
  subject: string;
  html: string;
  text: string;
}

const COLORS = {
  bg: "#F4EEE6",
  card: "#FFF8F0",
  heading: "#1a1714",
  body: "#3d3530",
  accent: "#6B7EC7",
  muted: "#8a8078",
  border: "#e5dccd",
};

const COPY: Record<
  AuthEmailType,
  { subject: string; heading: string; intro: string; ctaLabel: string; expiryNote: string }
> = {
  confirm: {
    subject: "Confirm your email for Beyond Why",
    heading: "Confirm your email",
    intro:
      "Thanks for joining Beyond Why. Confirm your email address to finish setting up your account.",
    ctaLabel: "Confirm Email",
    expiryNote: "This link expires in 24 hours.",
  },
  "magic-link": {
    subject: "Your sign-in link for Beyond Why",
    heading: "Sign in to Beyond Why",
    intro: "Click below to sign in to your account. No password needed.",
    ctaLabel: "Sign In",
    expiryNote: "This link expires in 1 hour and can only be used once.",
  },
  "reset-password": {
    subject: "Reset your Beyond Why password",
    heading: "Reset your password",
    intro:
      "We received a request to reset the password on your account. Click below to choose a new one.",
    ctaLabel: "Reset Password",
    expiryNote:
      "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
  },
  "change-email": {
    subject: "Confirm your new email address",
    heading: "Confirm your new email",
    intro: "Confirm this address to complete the email change on your Beyond Why account.",
    ctaLabel: "Confirm New Email",
    expiryNote:
      "This link expires in 24 hours. If you didn't request this change, you can safely ignore this email.",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml(params: {
  heading: string;
  intro: string;
  ctaLabel: string;
  actionUrl: string;
  expiryNote: string;
}): string {
  const { heading, intro, ctaLabel, actionUrl, expiryNote } = params;
  const safeUrl = escapeHtml(actionUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0; padding:0; background-color:${COLORS.bg};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.bg};">
  <tr>
    <td align="center" style="padding:40px 16px;">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%; background-color:${COLORS.card}; border-radius:8px;">
        <tr>
          <td style="padding:48px 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="font-family: 'Inter', Arial, sans-serif; font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:${COLORS.accent}; padding-bottom:24px;">
                  Beyond Why
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family: Georgia, 'Times New Roman', serif; font-weight:normal; font-size:24px; color:${COLORS.heading}; padding-bottom:12px;">
                  ${escapeHtml(heading)}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="height:2px; width:40px; background-color:${COLORS.accent}; font-size:0; line-height:0;">&nbsp;</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family: Georgia, 'Times New Roman', serif; font-size:16px; line-height:1.7; color:${COLORS.body}; padding-bottom:32px;">
                  ${escapeHtml(intro)}
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom:32px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" bgcolor="${COLORS.accent}" style="border-radius:6px;">
                        <a href="${safeUrl}" target="_blank" style="display:inline-block; padding:14px 32px; font-family:'Inter', Arial, sans-serif; font-size:14px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:#ffffff; text-decoration:none; border-radius:6px;">
                          ${escapeHtml(ctaLabel)}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family: Georgia, 'Times New Roman', serif; font-size:14px; line-height:1.6; color:${COLORS.muted}; padding-bottom:8px;">
                  Or copy and paste this link into your browser:
                </td>
              </tr>
              <tr>
                <td align="center" style="font-family: Arial, sans-serif; font-size:12px; line-height:1.6; color:${COLORS.accent}; word-break:break-all; padding-bottom:24px;">
                  <a href="${safeUrl}" target="_blank" style="color:${COLORS.accent}; text-decoration:underline;">${safeUrl}</a>
                </td>
              </tr>
              <tr>
                <td align="center" style="border-top:1px solid ${COLORS.border}; padding-top:20px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="center" style="font-family: Georgia, 'Times New Roman', serif; font-size:13px; color:${COLORS.muted};">
                        ${escapeHtml(expiryNote)}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px; width:100%;">
        <tr>
          <td align="center" style="padding:24px 16px 0; font-family:'Inter', Arial, sans-serif; font-size:12px; color:${COLORS.muted};">
            <a href="https://beyondwhy.org" target="_blank" style="color:${COLORS.muted}; text-decoration:underline;">beyondwhy.org</a>
            &nbsp;&middot;&nbsp;
            <a href="https://beyondwhy.org/privacy" target="_blank" style="color:${COLORS.muted}; text-decoration:underline;">Privacy</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildText(params: {
  heading: string;
  intro: string;
  actionUrl: string;
  expiryNote: string;
}): string {
  const { heading, intro, actionUrl, expiryNote } = params;
  return [
    "BEYOND WHY",
    "",
    heading,
    "",
    intro,
    "",
    actionUrl,
    "",
    expiryNote,
    "",
    "---",
    "beyondwhy.org",
  ].join("\n");
}

export function buildAuthEmail({ type, actionUrl, userEmail }: BuildAuthEmailParams): BuiltAuthEmail {
  void userEmail;
  const copy = COPY[type];

  return {
    subject: copy.subject,
    html: buildHtml({
      heading: copy.heading,
      intro: copy.intro,
      ctaLabel: copy.ctaLabel,
      actionUrl,
      expiryNote: copy.expiryNote,
    }),
    text: buildText({
      heading: copy.heading,
      intro: copy.intro,
      actionUrl,
      expiryNote: copy.expiryNote,
    }),
  };
}
