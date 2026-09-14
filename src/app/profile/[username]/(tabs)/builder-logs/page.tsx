import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getBookmarkItems } from "@/components/profile/BookmarksSection";
import { BookmarkTypeList } from "@/components/profile/BookmarkTypeList";
import { EmptyState } from "@/components/profile/EmptyState";
import { BuilderLogIcon } from "@/components/icons";

export default async function ProfileBuilderLogsTab({
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
    (item) => item.contentType === "builder-log"
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BuilderLogIcon size={32} />}
        message="No Builder Logs saved yet."
        ctaLabel="Browse →"
        ctaHref="/builder-log"
        variant="compact"
      />
    );
  }

  return <BookmarkTypeList items={items} />;
}
