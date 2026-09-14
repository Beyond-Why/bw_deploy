import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
import {
  createComment,
  getCommentsForContent,
  getCommentsForSeries,
  type CommentSort,
} from "@/lib/comments";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  const seriesId = searchParams.get("seriesId");
  const sort: CommentSort = searchParams.get("sort") === "top" ? "top" : "newest";

  if (!contentId && !seriesId) {
    return NextResponse.json(
      { error: "contentId or seriesId is required" },
      { status: 400 }
    );
  }

  // Comment likes are public, but "did the viewer like this" is per-user —
  // resolve who's asking (if anyone) so buildThreads can flag their likes.
  const viewer = await getCurrentUser();

  // contentId takes precedence — a single episode/hub thread — while
  // seriesId alone means the hub's aggregated view across every episode.
  const commentList = contentId
    ? await getCommentsForContent(contentId, sort, viewer?.id ?? null)
    : await getCommentsForSeries(seriesId as string, sort, viewer?.id ?? null);

  return NextResponse.json({ comments: commentList });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const contentId = body?.contentId;
  const contentType = body?.contentType;
  const seriesId = body?.seriesId;
  const episodeNumber = body?.episodeNumber;
  const episodeTitle = body?.episodeTitle;
  const parentId = body?.parentId;
  const text = body?.body;

  if (
    typeof contentId !== "string" ||
    !contentId ||
    (contentType !== "episode" && contentType !== "series") ||
    typeof seriesId !== "string" ||
    !seriesId ||
    typeof text !== "string"
  ) {
    return NextResponse.json({ error: "Invalid comment payload" }, { status: 400 });
  }

  const trimmed = text.trim();
  if (trimmed.length < 1 || trimmed.length > 2000) {
    return NextResponse.json(
      { error: "Comment must be between 1 and 2000 characters" },
      { status: 400 }
    );
  }

  const profile = await getProfileById(user.id);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 400 });
  }

  const comment = await createComment({
    userId: user.id,
    userHandle: profile.username,
    userDisplayName: profile.displayName || profile.username,
    userAvatarUrl: profile.avatarUrl,
    contentId,
    contentType,
    seriesId,
    episodeNumber: typeof episodeNumber === "string" ? episodeNumber : null,
    episodeTitle: typeof episodeTitle === "string" ? episodeTitle : null,
    parentId: typeof parentId === "string" ? parentId : null,
    body: trimmed,
  });

  return NextResponse.json({ comment: { ...comment, replies: [] } }, { status: 201 });
}
