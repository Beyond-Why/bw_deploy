import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getRecentCommentItems, RECENT_COMMENTS_PAGE_SIZE } from "@/components/profile/RecentCommentsSection";

/** "Load more" for the profile's Recent Comments section — always scoped
 *  to the signed-in caller's own comments (there's no `userId`/`username`
 *  param to pass), so there's no way to request another user's activity
 *  through this endpoint even if the UI that calls it were compromised. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limitParam = Number(searchParams.get("limit"));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 20
      ? limitParam
      : RECENT_COMMENTS_PAGE_SIZE;

  const cursorCreatedAt = searchParams.get("cursorCreatedAt");
  const cursorId = searchParams.get("cursorId");
  const cursor = cursorCreatedAt && cursorId ? { createdAt: cursorCreatedAt, id: cursorId } : undefined;

  const page = await getRecentCommentItems(user.id, limit, cursor);
  return NextResponse.json(page);
}
