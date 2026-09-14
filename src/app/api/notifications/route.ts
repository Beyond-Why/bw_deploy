import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getNotifications, getUnreadCount } from "@/lib/notifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [items, unreadCount] = await Promise.all([
    getNotifications(user.id, 20),
    getUnreadCount(user.id),
  ]);

  return NextResponse.json({ notifications: items, unreadCount });
}
