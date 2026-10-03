import {
  getSeriesIndex,
  getEpisode,
  getEpisodes,
  getAllSeries,
  getAllInsightCards,
} from "@/lib/content";
import { notFound } from "next/navigation";
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
import { JsonLd } from "@/components/seo/JsonLd";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  isPlaceholder,
  isUnreleased,
  metaDescription,
  modifiedDate,
  pageMetadata,
  publishedDate,
} from "@/lib/seo";

interface PageProps {
  params: Promise<{ series: string; episode: string }>;
  searchParams: Promise<{ resume?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { series, episode } = await params;
  let episodeData: Awaited<ReturnType<typeof getEpisode>>;
  let seriesData: Awaited<ReturnType<typeof getSeriesIndex>>;
  try {
    episodeData = await getEpisode("deep-dives", series, episode);
    seriesData = await getSeriesIndex("deep-dives", series);
  } catch {
    notFound();
  }
  const { frontmatter, content } = episodeData;
  if (isPlaceholder(frontmatter) || isPlaceholder(seriesData.frontmatter)) notFound();
  return pageMetadata({
    title: `${frontmatter.title} — ${seriesData.frontmatter.title}`,
    description: metaDescription(frontmatter, content),
    path: `/deep-dives/${series}/${episode}`,
    type: "article",
    publishedTime: publishedDate(frontmatter),
    modifiedTime: modifiedDate(frontmatter),
    section: seriesData.frontmatter.title,
    noindex: isUnreleased(seriesData.frontmatter, frontmatter),
  });
}

export default async function DeepDiveEpisodePage({ params, searchParams }: PageProps) {
  const { series, episode } = await params;
  const { resume } = await searchParams;

  // Core episode data
  let frontmatter: Awaited<ReturnType<typeof getEpisode>>["frontmatter"];
  let content: Awaited<ReturnType<typeof getEpisode>>["content"];
  let seriesData: Awaited<ReturnType<typeof getSeriesIndex>>;
  let episodes: Awaited<ReturnType<typeof getEpisodes>>;
  try {
    ({ frontmatter, content } = await getEpisode("deep-dives", series, episode));
    seriesData = await getSeriesIndex("deep-dives", series);
    episodes = await getEpisodes("deep-dives", series);
  } catch {
    notFound();
  }
  if (isPlaceholder(frontmatter) || isPlaceholder(seriesData.frontmatter)) notFound();

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

  const episodePath = `/deep-dives/${series}/${episode}`;
  const seriesPath = `/deep-dives/${series}`;
  const structuredData = [
    articleJsonLd({
      headline: frontmatter.title,
      description: metaDescription(frontmatter, content),
      path: episodePath,
      images: [`${episodePath}/opengraph-image`, frontmatter.thumbnail || seriesData.frontmatter.thumbnail],
      datePublished: publishedDate(frontmatter),
      dateModified: modifiedDate(frontmatter),
      position: frontmatter.episode,
      partOf: { name: seriesData.frontmatter.title, path: seriesPath },
    }),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: seriesData.frontmatter.title, path: seriesPath },
      { name: frontmatter.title, path: episodePath },
    ]),
  ];

  return (
    <>
      <JsonLd data={structuredData} />
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
    </>
  );
}
