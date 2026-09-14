import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getPollState } from "@/lib/polls";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pollId } = await params;
  const state = await getPollState(pollId, user.id);
  if (!state) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  return NextResponse.json(state);
}
