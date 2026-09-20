import type { Metadata } from "next";
import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { ContinueReadingSection, getContinueReadingItems } from "@/components/profile/ContinueReadingSection";
import { BookmarksSection, getBookmarkItems } from "@/components/profile/BookmarksSection";
import { RecentCommentsSection } from "@/components/profile/RecentCommentsSection";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  if (!profile) return { title: "Profile not found — Beyond Why" };
  return { title: `${profile.displayName || profile.username} — Beyond Why` };
}

export default async function ProfileHomePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  // Already resolved (and notFound()-guarded) by the tabs layout for this
  // same request — getProfileByUsername is React-cache-deduped, so this
  // doesn't re-hit the DB.
  const profile = await getProfileByUsername(username);
  const user = await getCurrentUser();
  const isOwner = !!profile && user?.id === profile.id;

  // Continue Reading, Bookmarks, and Comments are all personal — there's
  // no public-profile activity concept yet, so a visitor sees nothing.
  if (!isOwner || !profile) return null;

  const [continueReadingItems, bookmarkItems] = await Promise.all([
    getContinueReadingItems(profile.id),
    getBookmarkItems(profile.id),
  ]);

  // Recently Saved and Recent Comments always render their own heading —
  // each shows its own empty state internally rather than being skipped,
  // so the page is never left with a heading and blank space beneath it.
  // Continue Reading has no such empty state and stays skip-if-empty.
  return (
    <div>
      {continueReadingItems.length > 0 && <ContinueReadingSection items={continueReadingItems} />}
      <BookmarksSection items={bookmarkItems} />
      <RecentCommentsSection userId={profile.id} />
    </div>
  );
}
