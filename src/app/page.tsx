import type { Metadata } from "next";
import { getAllSeries, getFeaturedContent, getPopularContent, getCollections, getEpisodes, type EpisodeStats } from "@/lib/content";
import { HeroSection } from "@/components/HeroSection";
import { PopularSection } from "@/components/PopularSection";
import { ContentFeed } from "@/components/ContentFeed";
import { getLikeCountsByContentIds } from "@/lib/likes";
import { getCommentCountsByContentIds } from "@/lib/comments";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, pageMetadata, SITE_DESCRIPTION, SITE_NAME, websiteJsonLd } from "@/lib/seo";
import styles from "./page.module.css";

// Also served at /deep-dives, /insight-cards and /builder-log (rewrites in
// next.config.ts), which therefore all canonicalise to "/".
export const metadata: Metadata = {
  ...pageMetadata({ title: SITE_NAME, description: SITE_DESCRIPTION, path: "/" }),
  title: { absolute: SITE_NAME },
};

export default async function Home() {
  const deepDivesRaw = await getAllSeries("deep-dives");
  const deepDives = await Promise.all(
    deepDivesRaw.map(async (d) => {
      const episodes = await getEpisodes("deep-dives", d.slug);
      return { ...d, episodes };
    })
  );
  // Episode-tile engagement counts for every deep dive's hover strip — two
  // grouped queries across ALL series (one per table), not one per series.
  // Keyed by full contentId. A DB failure degrades to dates-only tiles
  // rather than taking the homepage down with it.
  const episodeContentIds = deepDives.flatMap((d) =>
    d.episodes.map((ep) => `deep-dives/${d.slug}/${ep.slug}`)
  );
  const episodeStats: EpisodeStats = {};
  try {
    const [likeCounts, commentCounts] = await Promise.all([
      getLikeCountsByContentIds(episodeContentIds, "episode"),
      getCommentCountsByContentIds(episodeContentIds, "episode"),
    ]);
    for (const contentId of episodeContentIds) {
      episodeStats[contentId] = {
        likeCount: likeCounts.get(contentId) ?? 0,
        commentCount: commentCounts.get(contentId) ?? 0,
      };
    }
  } catch (err) {
    console.error("Homepage episode stats failed; rendering tiles without counts", err);
  }
  const builderLogsRaw = await getAllSeries("builder-log");
  const builderLogs = await Promise.all(
    builderLogsRaw.map(async (b) => {
      const episodes = await getEpisodes("builder-log", b.slug);
      return {
        ...b,
        episodes,
      };
    })
  );
  const collections = await getCollections();
  const featuredContent = await getFeaturedContent();
  const popularContent = await getPopularContent();
  // Generated once per request, server-side only, then threaded down as
  // props — see InsightRowHeadingProvider and feedScheduler.ts for why
  // these can't be Math.random() calls inside the client component itself.
  const headingShuffleSeed = Math.floor(Math.random() * 2 ** 31);
  const feedScheduleSeed = Math.floor(Math.random() * 2 ** 31);

  return (
    <>
      <JsonLd data={[websiteJsonLd(), organizationJsonLd(true)]} />
      <div className={styles.page}>
        {/* Dark canvas hero — self-contained, sits inside the page container */}
        {featuredContent && <HeroSection content={featuredContent} />}

        {/* Most Popular Section */}
        <PopularSection content={popularContent} />

        {/* Unified Content Feed */}
        <ContentFeed
          deepDives={deepDives}
          builderLogs={builderLogs}
          collections={collections}
          episodeStats={episodeStats}
          headingShuffleSeed={headingShuffleSeed}
          feedScheduleSeed={feedScheduleSeed}
        />
      </div>
    </>
  );
}
