import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getRepliesForComment } from "@/lib/comments";

/** A single comment's direct replies — used by the profile's Recent
 *  Comments section to expand one of the owner's top-level comments
 *  in place, without re-fetching the whole episode/hub thread it lives on. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();
  const replies = await getRepliesForComment(id, viewer?.id ?? null);
  return NextResponse.json({ replies });
}
