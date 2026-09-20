import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { softDeleteThread } from "@/lib/comments";

/** Deletes a top-level comment and every reply to it in one atomic
 *  operation — used by the "delete this comment and its replies"
 *  confirmation flow, distinct from the plain single-comment
 *  DELETE /api/comments/[id]. Ownership is enforced server-side against
 *  the parent only (see softDeleteThread); a 404 covers "not found",
 *  "not yours", and "not actually a top-level comment" alike, same
 *  not-found-vs-forbidden non-disclosure convention as the existing
 *  single-delete route. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await softDeleteThread(id, user.id);
  if (!deleted) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  return NextResponse.json({ deleted: true });
}
