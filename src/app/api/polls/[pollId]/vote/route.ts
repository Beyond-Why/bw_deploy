import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/getUser";
import { AlreadyVotedError, castVote, getPoll, getPollResults } from "@/lib/polls";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ pollId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pollId } = await params;
  const body = await request.json().catch(() => null);
  const optionId = typeof body?.optionId === "string" ? body.optionId : "";

  if (!optionId) {
    return NextResponse.json({ error: "optionId is required" }, { status: 400 });
  }

  const poll = await getPoll(pollId);
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  if (!poll.options.some((o) => o.id === optionId)) {
    return NextResponse.json({ error: "optionId is not a valid option for this poll" }, {
      status: 400,
    });
  }

  if (poll.expiresAt && poll.expiresAt.getTime() < Date.now()) {
    return NextResponse.json({ error: "This poll has expired" }, { status: 400 });
  }

  try {
    await castVote(pollId, user.id, optionId);
  } catch (err) {
    if (err instanceof AlreadyVotedError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const results = await getPollResults(pollId);
  return NextResponse.json({ ok: true, results, userVote: optionId });
}
