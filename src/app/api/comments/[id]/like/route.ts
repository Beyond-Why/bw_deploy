import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { likeComment, unlikeComment } from "@/lib/commentLikes";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const count = await likeComment(id, user.id);
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const count = await unlikeComment(id, user.id);
  return NextResponse.json({ liked: false, count });
}
