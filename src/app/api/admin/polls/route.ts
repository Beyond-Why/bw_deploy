import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { broadcastNotification } from "@/lib/notifications";
import { createPoll } from "@/lib/polls";
import type { PollOption } from "@/lib/db/schema";

const TITLE_MAX_LEN = 80;

/**
 * Author-triggered poll creation — inserts one `polls` row, then fans a
 * "poll" notification out to every profile via the same
 * broadcastNotification() the /api/admin/notifications route uses.
 * Protected by the same single-admin id check as that route (checks the
 * signed-in session against NEXT_PUBLIC_ADMIN_USER_ID — there is no
 * separate role system).
 *
 * ── How to create a poll ──
 * This route checks the caller's own signed-in Supabase session, not a
 * header — there is no `x-admin-id` (or any other) header this route
 * reads. To call it you must be signed in as the admin account in your
 * browser and send the request with that session's cookies attached, e.g.
 * from the browser console while on the site, signed in as the admin:
 *
 *   await fetch("/api/admin/polls", {
 *     method: "POST",
 *     headers: { "Content-Type": "application/json" },
 *     body: JSON.stringify({
 *       question: "Which topic should I cover next?",
 *       options: ["Quantum mechanics", "General relativity", "Thermodynamics"],
 *       expiresAt: "2026-10-01T00:00:00Z",
 *     }),
 *   }).then((r) => r.json());
 *
 * A plain `curl` call (with no cookies) will always get a 401 here, no
 * matter what headers are added — there is no bearer-token/admin-header
 * path into this route, by design (same as /api/admin/notifications).
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (!user || !adminId || user.id !== adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const rawOptions = Array.isArray(body?.options) ? body.options : null;
  const expiresAtRaw = body?.expiresAt;

  if (!question || !rawOptions || rawOptions.length < 2) {
    return NextResponse.json(
      { error: "question and at least 2 options are required" },
      { status: 400 }
    );
  }

  const labels = rawOptions
    .map((o: unknown) => (typeof o === "string" ? o.trim() : ""))
    .filter((label: string) => label.length > 0);

  if (labels.length < 2) {
    return NextResponse.json(
      { error: "options must be a list of at least 2 non-empty strings" },
      { status: 400 }
    );
  }

  let expiresAt: string | null = null;
  if (expiresAtRaw !== undefined && expiresAtRaw !== null) {
    if (typeof expiresAtRaw !== "string" || isNaN(new Date(expiresAtRaw).getTime())) {
      return NextResponse.json(
        { error: "expiresAt must be a valid ISO date string" },
        { status: 400 }
      );
    }
    expiresAt = expiresAtRaw;
  }

  const options: PollOption[] = labels.map((label: string, i: number) => ({
    id: String(i),
    label,
  }));

  const pollId = await createPoll({
    question,
    options,
    createdBy: user.id,
    expiresAt,
  });

  const title = question.length > TITLE_MAX_LEN ? `${question.slice(0, TITLE_MAX_LEN - 1)}…` : question;

  const recipientCount = await broadcastNotification({
    type: "poll",
    title,
    body: "Vote now — tap to see options",
    contentUrl: `/polls/${pollId}`,
  });

  return NextResponse.json({ ok: true, id: pollId, recipientCount });
}
