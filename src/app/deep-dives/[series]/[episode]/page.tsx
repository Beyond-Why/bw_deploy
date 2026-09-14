import {
  getSeriesIndex,
  getEpisode,
  getEpisodes,
  getAllSeries,
  getAllInsightCards,
} from "@/lib/content";
import { MDXRemote } from "next-mdx-remote/rsc";
import { mdxComponents } from "@/components/mdx/MDXComponents";
import { mdxOptions } from "@/components/mdx/mdxOptions";
import { EpisodeReader } from "@/components/reading/EpisodeReader";
import { getCurrentUser } from "@/lib/auth/getUser";
import { getLikeState } from "@/lib/likes";
import { getBookmarkState } from "@/lib/bookmarks";
import { getReadingProgress } from "@/lib/readingProgress";
import { getProfileById } from "@/lib/profile";
import type { CurrentUser } from "@/components/comments/CommentSection";

interface PageProps {
  params: Promise<{ series: string; episode: string }>;
  searchParams: Promise<{ resume?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series, episode } = await params;
  const { frontmatter } = await getEpisode("deep-dives", series, episode);
  const seriesData = await getSeriesIndex("deep-dives", series);
  return {
    title: `${frontmatter.title} — ${seriesData.frontmatter.title} — Beyond Why`,
    description: frontmatter.description,
  };
}

export default async function DeepDiveEpisodePage({ params, searchParams }: PageProps) {
  const { series, episode } = await params;
  const { resume } = await searchParams;

  // Core episode data
  const { frontmatter, content } = await getEpisode("deep-dives", series, episode);
  const seriesData = await getSeriesIndex("deep-dives", series);
  const episodes = await getEpisodes("deep-dives", series);

  // Likes + reading progress — keyed by a compound id so slugs never
  // collide across series/collections.
  const contentId = `deep-dives/${series}/${episode}`;
  const seriesId = `deep-dives/${series}`;

  const user = await getCurrentUser();
  const isAuthenticated = !!user;
  const profile = user ? await getProfileById(user.id) : null;
  const currentUser: CurrentUser | null = profile
    ? {
        id: profile.id,
        handle: profile.username,
        displayName: profile.displayName || profile.username,
        avatarUrl: profile.avatarUrl,
      }
    : null;
  const { count: initialLikeCount, liked: initialLiked } = await getLikeState(
    user?.id ?? null,
    contentId,
    "episode"
  );
  const { count: initialBookmarkCount, bookmarked: initialBookmarked } = await getBookmarkState(
    user?.id ?? null,
    contentId,
    "episode"
  );
  const bookmarkMetadata = {
    contentTitle: frontmatter.title,
    contentUrl: `/deep-dives/${series}/${episode}`,
    seriesTitle: seriesData.frontmatter.title,
    seriesSlug: series,
    episodeNumber: frontmatter.episode,
    thumbnailUrl: frontmatter.thumbnail || seriesData.frontmatter.thumbnail || null,
    contentCategory: seriesData.frontmatter.category ?? null,
  };

  let resumeScrollPercent: number | null = null;
  if (resume === "true" && user) {
    const progress = await getReadingProgress(user.id, contentId, "episode");
    resumeScrollPercent = progress ? progress.scrollPercent : null;
  }

  // Navigation
  const currentIndex = episodes.findIndex((ep) => ep.slug === episode);
  const prevEpisode = currentIndex > 0 ? episodes[currentIndex - 1] : null;
  const nextEpisode =
    currentIndex < episodes.length - 1 ? episodes[currentIndex + 1] : null;

  // Sidebar data — fetched server-side
  const allDeepDivesRaw = await getAllSeries("deep-dives");
  const relatedSeries = await Promise.all(
    allDeepDivesRaw
      .filter((s) => s.slug !== series)
      .slice(0, 3)
      .map(async (s) => ({
        ...s,
        episodes: await getEpisodes("deep-dives", s.slug),
      }))
  );

  const allBuilderLogsRaw = await getAllSeries("builder-log");
  const builderLogs = await Promise.all(
    allBuilderLogsRaw.slice(0, 2).map(async (b) => ({
      ...b,
      episodes: await getEpisodes("builder-log", b.slug),
    }))
  );

  const allInsightCards = await getAllInsightCards();
  const insightCards = allInsightCards.slice(0, 4);

  return (
    <EpisodeReader
      series={series}
      seriesTitle={seriesData.frontmatter.title}
      frontmatter={frontmatter}
      episodes={episodes}
      currentIndex={currentIndex}
      currentEpisodeSlug={episode}
      prevEpisode={prevEpisode}
      nextEpisode={nextEpisode}
      relatedSeries={relatedSeries}
      builderLogs={builderLogs}
      insightCards={insightCards}
      contentId={contentId}
      seriesId={seriesId}
      initialLikeCount={initialLikeCount}
      initialLiked={initialLiked}
      initialBookmarkCount={initialBookmarkCount}
      initialBookmarked={initialBookmarked}
      bookmarkMetadata={bookmarkMetadata}
      isAuthenticated={isAuthenticated}
      resumeScrollPercent={resumeScrollPercent}
      user={currentUser}
    >
      {/* MDXRemote renders server-side; output passed as children to client component */}
      <MDXRemote source={content} components={mdxComponents} options={mdxOptions} />
    </EpisodeReader>
  );
}
