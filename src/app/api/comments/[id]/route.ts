import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { softDeleteComment } from "@/lib/comments";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await softDeleteComment(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
