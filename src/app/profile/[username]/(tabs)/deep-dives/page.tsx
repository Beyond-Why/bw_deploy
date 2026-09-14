import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getBookmarkItems } from "@/components/profile/BookmarksSection";
import { EpisodeGrid } from "@/components/profile/EpisodeGrid";
import { EmptyState } from "@/components/profile/EmptyState";
import { DeepDiveIcon } from "@/components/icons";

export default async function ProfileDeepDivesTab({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getProfileByUsername(username);
  const user = await getCurrentUser();
  const isOwner = !!profile && user?.id === profile.id;

  // Personal, private tab — no public-profile concept yet.
  if (!isOwner || !profile) return null;

  const items = (await getBookmarkItems(profile.id)).filter(
    (item) => item.contentType === "episode" || item.contentType === "series"
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<DeepDiveIcon size={32} />}
        message="No Deep Dives saved yet."
        ctaLabel="Browse →"
        ctaHref="/deep-dives"
        variant="compact"
      />
    );
  }

  return <EpisodeGrid items={items} />;
}
