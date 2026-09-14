import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getContinueReading, saveReadingProgress } from "@/lib/readingProgress";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentId = body?.contentId;
  const contentType = body?.contentType;
  const scrollPercent = body?.scrollPercent;

  if (
    typeof contentId !== "string" ||
    typeof contentType !== "string" ||
    !contentId ||
    !contentType ||
    typeof scrollPercent !== "number" ||
    Number.isNaN(scrollPercent)
  ) {
    return NextResponse.json(
      { error: "contentId, contentType, and scrollPercent are required" },
      { status: 400 }
    );
  }

  await saveReadingProgress({
    userId: user.id,
    contentId,
    contentType,
    seriesId: typeof body?.seriesId === "string" ? body.seriesId : null,
    scrollPercent,
    completed: body?.completed === true,
  });

  return NextResponse.json({ success: true });
}

/** Current user's incomplete, in-progress episodes — sorted most-recent first. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await getContinueReading(user.id);
  return NextResponse.json(
    rows.map((row) => ({
      contentId: row.contentId,
      contentType: row.contentType,
      seriesId: row.seriesId,
      scrollPercent: row.scrollPercent,
      completed: row.completed,
      lastReadAt: row.lastReadAt,
    }))
  );
}
