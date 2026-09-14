import { getProfileByUsername } from "@/lib/profile";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getBookmarkItems } from "@/components/profile/BookmarksSection";
import { buildInsightSaves } from "@/components/profile/insightSaves";
import { InsightSaveStack } from "@/components/profile/InsightSaveStack";
import { EmptyState } from "@/components/profile/EmptyState";
import { InsightCardIcon } from "@/components/icons";

export default async function ProfileInsightCardsTab({
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
    (item) => item.contentType === "insight-card" || item.contentType === "insight-collection"
  );

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<InsightCardIcon size={32} />}
        message="No Insight Cards saved yet."
        ctaLabel="Browse →"
        ctaHref="/insight-cards"
        variant="compact"
      />
    );
  }

  const insightSaves = await buildInsightSaves(items);

  return <InsightSaveStack saves={insightSaves} />;
}
