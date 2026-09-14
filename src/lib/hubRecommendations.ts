import "server-only";

import { getAllSeries, getEpisodes, getSeriesIndex, getEpisode } from "@/lib/content";
import { getContinueReading, type ReadingProgressRow } from "@/lib/readingProgress";
import type { ProfileContentPreview } from "@/components/ui/ContentPreviewCard";

const RECOMMENDATION_LIMIT = 5;

/** contentId is "deep-dives/{series}/{episode}" — see the episode page,
 *  which writes it. Builder-log progress and the current series itself
 *  are excluded — "Continue Reading" here means "another deep dive". */
async function enrichContinueReadingRow(
  row: ReadingProgressRow,
  excludeSeriesSlug: string
): Promise<ProfileContentPreview | null> {
  const [collection, seriesSlug, episodeSlug] = row.contentId.split("/");
  if (collection !== "deep-dives") return null;
  if (!seriesSlug || !episodeSlug || seriesSlug === excludeSeriesSlug) return null;

  try {
    const [series, episode, episodes] = await Promise.all([
      getSeriesIndex("deep-dives", seriesSlug),
      getEpisode("deep-dives", seriesSlug, episodeSlug),
      getEpisodes("deep-dives", seriesSlug),
    ]);

    return {
      type: "deep-dive",
      title: series.frontmatter.title,
      href: `/deep-dives/${seriesSlug}/${episodeSlug}?resume=true`,
      thumbnail: episode.frontmatter.thumbnail || series.frontmatter.thumbnail,
      progressPercent: Math.round(row.scrollPercent * 100),
      meta: `Episode ${episode.frontmatter.episode} of ${episodes.length}`,
    };
  } catch {
    // Content since removed/renamed on disk — skip rather than crash the page.
    return null;
  }
}

export interface HubRecommendations {
  continueReading: ProfileContentPreview[];
  otherDeepDives: ProfileContentPreview[];
  relatedEpisodes: ProfileContentPreview[];
}

/** The hub page's "Keep Exploring" data — everything scoped to "not this
 *  series". Continue Reading is personal (empty when signed out); Other
 *  Deep Dives and Related Episodes are the same for every visitor. */
export async function getHubRecommendations(
  seriesSlug: string,
  userId: string | null
): Promise<HubRecommendations> {
  const allSeries = await getAllSeries("deep-dives");
  const others = allSeries.filter((s) => s.slug !== seriesSlug);

  const [continueReadingRows, othersWithEpisodes] = await Promise.all([
    userId ? getContinueReading(userId, 10) : Promise.resolve([]),
    Promise.all(
      others.map(async (s) => ({ ...s, episodes: await getEpisodes("deep-dives", s.slug) }))
    ),
  ]);

  const resolvedContinueReading = await Promise.all(
    continueReadingRows.map((row) => enrichContinueReadingRow(row, seriesSlug))
  );
  const continueReading = (
    resolvedContinueReading.filter((item): item is ProfileContentPreview => item !== null)
  ).slice(0, RECOMMENDATION_LIMIT);

  const otherDeepDives: ProfileContentPreview[] = othersWithEpisodes
    .slice(0, RECOMMENDATION_LIMIT)
    .map((s) => ({
      type: "deep-dive",
      title: s.frontmatter.title,
      href: `/deep-dives/${s.slug}`,
      thumbnail: s.frontmatter.thumbnail,
      meta: `${s.episodes.length} episode${s.episodes.length !== 1 ? "s" : ""}`,
    }));

  // Aspirational stand-in for real topic-based relevance — one lead
  // episode per other series, until there's a way to actually relate them.
  const relatedEpisodes: ProfileContentPreview[] = othersWithEpisodes
    .filter((s) => s.episodes.length > 0)
    .slice(0, RECOMMENDATION_LIMIT)
    .map((s) => {
      const ep = s.episodes[0];
      return {
        type: "deep-dive",
        title: ep.frontmatter.title,
        href: `/deep-dives/${s.slug}/${ep.slug}`,
        thumbnail: ep.frontmatter.thumbnail || s.frontmatter.thumbnail,
        meta: `Episode ${ep.frontmatter.episode} · ${s.frontmatter.title}`,
      };
    });

  return { continueReading, otherDeepDives, relatedEpisodes };
}
