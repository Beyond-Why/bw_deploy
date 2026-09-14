import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import {
  getBookmarkState,
  toggleBookmark,
  updateActiveCardIndex,
  type BookmarkMetadata,
} from "@/lib/bookmarks";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType");

  if (!contentId || !contentType) {
    return NextResponse.json(
      { error: "contentId and contentType are required" },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  const state = await getBookmarkState(user?.id ?? null, contentId, contentType);
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentId = body?.contentId;
  const contentType = body?.contentType;
  const metadata = body?.metadata;

  if (typeof contentId !== "string" || typeof contentType !== "string" || !contentId || !contentType) {
    return NextResponse.json(
      { error: "contentId and contentType are required" },
      { status: 400 }
    );
  }

  if (
    !metadata ||
    typeof metadata.contentTitle !== "string" ||
    typeof metadata.contentUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "metadata.contentTitle and metadata.contentUrl are required" },
      { status: 400 }
    );
  }

  const bookmarkMetadata: BookmarkMetadata = {
    contentTitle: metadata.contentTitle,
    contentUrl: metadata.contentUrl,
    seriesTitle: typeof metadata.seriesTitle === "string" ? metadata.seriesTitle : null,
    seriesSlug: typeof metadata.seriesSlug === "string" ? metadata.seriesSlug : null,
    episodeNumber: typeof metadata.episodeNumber === "number" ? metadata.episodeNumber : null,
    thumbnailUrl: typeof metadata.thumbnailUrl === "string" ? metadata.thumbnailUrl : null,
    activeCardIndex: typeof metadata.activeCardIndex === "number" ? metadata.activeCardIndex : null,
    contentCategory: typeof metadata.contentCategory === "string" ? metadata.contentCategory : null,
  };

  const state = await toggleBookmark(user.id, contentId, contentType, bookmarkMetadata);
  return NextResponse.json(state);
}

/** Silently repoints an existing bookmark's activeCardIndex — used by the
 *  insight card reader to keep a saved collection pointing at the card the
 *  user last read, without treating that as a new save/toast event. */
export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentId = body?.contentId;
  const contentType = body?.contentType;
  const activeCardIndex = body?.activeCardIndex;

  if (
    typeof contentId !== "string" ||
    typeof contentType !== "string" ||
    !contentId ||
    !contentType ||
    typeof activeCardIndex !== "number" ||
    !Number.isInteger(activeCardIndex) ||
    activeCardIndex < 0
  ) {
    return NextResponse.json(
      { error: "contentId, contentType, and a non-negative integer activeCardIndex are required" },
      { status: 400 }
    );
  }

  await updateActiveCardIndex(user.id, contentId, contentType, activeCardIndex);
  return NextResponse.json({ success: true });
}
