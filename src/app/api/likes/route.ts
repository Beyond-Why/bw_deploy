import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getLikeState, toggleLike } from "@/lib/likes";

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
  const state = await getLikeState(user?.id ?? null, contentId, contentType);
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

  if (typeof contentId !== "string" || typeof contentType !== "string" || !contentId || !contentType) {
    return NextResponse.json(
      { error: "contentId and contentType are required" },
      { status: 400 }
    );
  }

  const state = await toggleLike(user.id, contentId, contentType);
  return NextResponse.json(state);
}
