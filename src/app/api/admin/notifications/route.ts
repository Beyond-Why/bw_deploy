import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { broadcastNotification, type NotificationType } from "@/lib/notifications";

const VALID_TYPES: NotificationType[] = ["new_deep_dive", "new_episode", "new_insight_collection"];

/** Author-triggered broadcast — fans one notification row out to every
 *  profile. Protected by a single-admin id check, not real role-based
 *  auth: fine for now since there's exactly one author. */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

  if (!user || !adminId || user.id !== adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const type = body?.type;
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const notificationBody = typeof body?.body === "string" ? body.body.trim() : "";
  const contentUrl = typeof body?.contentUrl === "string" ? body.contentUrl.trim() : "";

  if (
    typeof type !== "string" ||
    !VALID_TYPES.includes(type as NotificationType) ||
    !title ||
    !notificationBody ||
    !contentUrl
  ) {
    return NextResponse.json(
      { error: "type, title, body, and contentUrl are required" },
      { status: 400 }
    );
  }

  const recipientCount = await broadcastNotification({
    type: type as NotificationType,
    title,
    body: notificationBody,
    contentUrl,
  });

  return NextResponse.json({ ok: true, recipientCount });
}
