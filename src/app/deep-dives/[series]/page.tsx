import { getSeriesIndex, getEpisodes, getCollections, type EpisodeStats } from "@/lib/content";
import { notFound } from "next/navigation";
import { DeepDiveContent } from "@/components/DeepDiveContent";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getProfileById } from "@/lib/profile";
import { getHubRecommendations } from "@/lib/hubRecommendations";
import { getLikeCountsByContentIds } from "@/lib/likes";
import { getCommentCountsByContentIds } from "@/lib/comments";
import type { CurrentUser } from "@/components/comments/CommentSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { isPlaceholder, isUnreleased, metaDescription, pageMetadata, seriesJsonLd } from "@/lib/seo";

interface PageProps {
  params: Promise<{ series: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series } = await params;
  let seriesData: Awaited<ReturnType<typeof getSeriesIndex>>;
  try {
    seriesData = await getSeriesIndex("deep-dives", series);
  } catch {
    notFound();
  }
  const { frontmatter, content } = seriesData;
  if (isPlaceholder(frontmatter)) notFound();
  return pageMetadata({
    title: frontmatter.title,
    description: metaDescription(frontmatter, content),
    path: `/deep-dives/${series}`,
    noindex: isUnreleased(frontmatter),
  });
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
  if (isPlaceholder(frontmatter)) notFound();

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

  const structuredData = seriesJsonLd({
    name: frontmatter.title,
    description: metaDescription(frontmatter, content),
    path: `/deep-dives/${series}`,
    image: frontmatter.thumbnail,
    parts: episodes
      .filter((ep) => !isUnreleased(frontmatter, ep.frontmatter))
      .map((ep) => ({
        headline: ep.frontmatter.title,
        path: `/deep-dives/${series}/${ep.slug}`,
        position: ep.episode,
      })),
  });

  return (
    <>
      <JsonLd data={structuredData} />
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
    </>
  );
}
