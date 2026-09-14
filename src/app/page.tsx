import { getAllSeries, getFeaturedContent, getPopularContent, getCollections, getEpisodes } from "@/lib/content";
import { HeroSection } from "@/components/HeroSection";
import { PopularSection } from "@/components/PopularSection";
import { ContentFeed } from "@/components/ContentFeed";
import styles from "./page.module.css";

export default async function Home() {
  const deepDivesRaw = await getAllSeries("deep-dives");
  const deepDives = await Promise.all(
    deepDivesRaw.map(async (d) => {
      const episodes = await getEpisodes("deep-dives", d.slug);
      return { ...d, episodes };
    })
  );
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
        headingShuffleSeed={headingShuffleSeed}
        feedScheduleSeed={feedScheduleSeed}
      />
    </div>
  );
}
