import type { Metadata } from "next";
import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { ContinueReadingSection, getContinueReadingItems } from "@/components/profile/ContinueReadingSection";
import { BookmarksSection, getBookmarkItems } from "@/components/profile/BookmarksSection";
import { CommentsSection } from "@/components/profile/CommentsSection";
import { EmptyState } from "@/components/profile/EmptyState";
import { OpenBookIcon } from "@/components/icons";

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

  // Comments has no real data source yet (see CommentsSection) — always empty.
  if (continueReadingItems.length === 0 && bookmarkItems.length === 0) {
    return (
      <EmptyState
        icon={<OpenBookIcon size={32} />}
        message="Nothing here yet."
        subMessage="Start reading to see your progress and saves."
        ctaLabel="Explore Deep Dives →"
        ctaHref="/deep-dives"
      />
    );
  }

  return (
    <div>
      {continueReadingItems.length > 0 && <ContinueReadingSection items={continueReadingItems} />}
      {bookmarkItems.length > 0 && <BookmarksSection items={bookmarkItems} />}
      <CommentsSection />
    </div>
  );
}
