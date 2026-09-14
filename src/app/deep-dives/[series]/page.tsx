import { getSeriesIndex, getEpisodes, getCollections } from "@/lib/content";
import { notFound } from "next/navigation";
import { DeepDiveContent, type EpisodeStats } from "@/components/DeepDiveContent";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
import { getHubRecommendations } from "@/lib/hubRecommendations";
import { getLikeCountsByContentIds } from "@/lib/likes";
import { getCommentCountsByContentIds } from "@/lib/comments";
import type { CurrentUser } from "@/components/comments/CommentSection";

interface PageProps {
  params: Promise<{ series: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series } = await params;
  try {
    const { frontmatter } = await getSeriesIndex("deep-dives", series);
    return {
      title: `${frontmatter.title} — Beyond Why`,
      description: frontmatter.description,
    };
  } catch {
    return {};
  }
}

export default async function DeepDiveSeriesPage({ params }: PageProps) {
  const { series } = await params;
  let frontmatter: Awaited<ReturnType<typeof getSeriesIndex>>["frontmatter"];
  let content: Awaited<ReturnType<typeof getSeriesIndex>>["content"];
  let episodes: Awaited<ReturnType<typeof getEpisodes>>;
  try {
    ({ frontmatter, content } = await getSeriesIndex("deep-dives", series));
    episodes = await getEpisodes("deep-dives", series);
  } catch {
    notFound();
  }

  const user = await getCurrentUser();
  const profile = user ? await getProfileById(user.id) : null;
  const currentUser: CurrentUser | null = profile
    ? {
        id: profile.id,
        handle: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl,
      }
    : null;

  // "From the Cards" — every Insight Card collection (no topic-filtering
  // yet, so this is everything available rather than something related).
  const collections = await getCollections();

  // "Keep Exploring" — Continue Reading (personal), Other Deep Dives, and
  // Related Episodes (aspirational stand-in until real relevance exists),
  // all scoped to "not this series".
  const recommendations = await getHubRecommendations(series, user?.id ?? null);

  // Episode row engagement counts — two grouped queries (one per table),
  // not one query per episode.
  const episodeContentIds = episodes.map((ep) => `deep-dives/${series}/${ep.slug}`);
  const [likeCounts, commentCounts] = await Promise.all([
    getLikeCountsByContentIds(episodeContentIds, "episode"),
    getCommentCountsByContentIds(episodeContentIds, "episode"),
  ]);
  const episodeStats: EpisodeStats = {};
  for (const ep of episodes) {
    const contentId = `deep-dives/${series}/${ep.slug}`;
    episodeStats[ep.slug] = {
      likeCount: likeCounts.get(contentId) ?? 0,
      commentCount: commentCounts.get(contentId) ?? 0,
    };
  }

  return (
    <DeepDiveContent
      series={series}
      frontmatter={frontmatter}
      content={content}
      episodes={episodes}
      user={currentUser}
      collections={collections}
      recommendations={recommendations}
      episodeStats={episodeStats}
    />
  );
}
