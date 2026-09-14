import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { polls, pollVotes, type PollOption } from "@/lib/db/schema";

export type PollRow = typeof polls.$inferSelect;

export interface PollState {
  poll: {
    id: string;
    question: string;
    options: PollOption[];
    expiresAt: string | null;
  };
  results: Record<string, number>;
  userVote: string | null;
}

/** Thrown by castVote() when the DB's unique(pollId, userId) constraint
 *  rejects a second vote — the route maps this to a 409. */
export class AlreadyVotedError extends Error {}

function isUniqueViolation(err: unknown): boolean {
  // postgres.js attaches the Postgres SQLSTATE code to thrown errors —
  // 23505 is unique_violation.
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export async function getPoll(pollId: string): Promise<PollRow | null> {
  const [row] = await db.select().from(polls).where(eq(polls.id, pollId)).limit(1);
  return row ?? null;
}

export async function getPollResults(pollId: string): Promise<Record<string, number>> {
  const rows = await db
    .select({ optionId: pollVotes.optionId, value: sql<number>`count(*)` })
    .from(pollVotes)
    .where(eq(pollVotes.pollId, pollId))
    .groupBy(pollVotes.optionId);

  const results: Record<string, number> = {};
  for (const row of rows) results[row.optionId] = Number(row.value);
  return results;
}

export async function getUserVote(pollId: string, userId: string): Promise<string | null> {
  const [row] = await db
    .select({ optionId: pollVotes.optionId })
    .from(pollVotes)
    .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId)))
    .limit(1);
  return row?.optionId ?? null;
}

/** Combined read used by GET /api/polls/[pollId]. Null when the poll
 *  doesn't exist. */
export async function getPollState(pollId: string, userId: string): Promise<PollState | null> {
  const poll = await getPoll(pollId);
  if (!poll) return null;

  const [results, userVote] = await Promise.all([
    getPollResults(pollId),
    getUserVote(pollId, userId),
  ]);

  return {
    poll: {
      id: poll.id,
      question: poll.question,
      options: poll.options,
      expiresAt: poll.expiresAt ? poll.expiresAt.toISOString() : null,
    },
    results,
    userVote,
  };
}

/** Used by the admin broadcast route only (POST /api/admin/polls). */
export async function createPoll(input: {
  question: string;
  options: PollOption[];
  createdBy: string;
  expiresAt: string | null;
}): Promise<string> {
  const [row] = await db
    .insert(polls)
    .values({
      question: input.question,
      options: input.options,
      createdBy: input.createdBy,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    })
    .returning({ id: polls.id });
  return row.id;
}

/** Throws AlreadyVotedError if this user already voted in this poll —
 *  the DB's unique(pollId, userId) index is the actual source of truth,
 *  this just turns that constraint violation into a typed error. */
export async function castVote(pollId: string, userId: string, optionId: string): Promise<void> {
  try {
    await db.insert(pollVotes).values({ pollId, userId, optionId });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new AlreadyVotedError("You've already voted in this poll.");
    }
    throw err;
  }
}
