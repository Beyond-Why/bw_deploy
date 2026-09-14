import { getSeriesIndex, getEpisode, getEpisodes } from "@/lib/content";
import { getContinueReading, type ReadingProgressRow } from "@/lib/readingProgress";
import { ContentPreviewCard, type ProfileContentPreview, type ProfileContentType } from "@/components/ui/ContentPreviewCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Carousel } from "@/components/ui/Carousel";
import styles from "./ProfileHomeSection.module.css";

const COLLECTION_TYPE: Record<"deep-dives" | "builder-log", ProfileContentType> = {
  "deep-dives": "deep-dive",
  "builder-log": "builder-log",
};

/** contentId is "{collection}/{series}/{episode}" — see the episode page, which writes it. */
async function enrichRow(row: ReadingProgressRow): Promise<ProfileContentPreview | null> {
  const [collection, seriesSlug, episodeSlug] = row.contentId.split("/");
  if (collection !== "deep-dives" && collection !== "builder-log") return null;
  if (!seriesSlug || !episodeSlug) return null;

  try {
    const [series, episode, episodes] = await Promise.all([
      getSeriesIndex(collection, seriesSlug),
      getEpisode(collection, seriesSlug, episodeSlug),
      getEpisodes(collection, seriesSlug),
    ]);

    return {
      type: COLLECTION_TYPE[collection],
      title: series.frontmatter.title,
      href: `/${collection}/${seriesSlug}/${episodeSlug}?resume=true`,
      thumbnail: episode.frontmatter.thumbnail || series.frontmatter.thumbnail,
      progressPercent: Math.round(row.scrollPercent * 100),
      meta: `${collection === "deep-dives" ? "Episode" : "Log"} ${episode.frontmatter.episode} of ${episodes.length}`,
    };
  } catch {
    // Content since removed/renamed on disk — skip rather than crash the tab.
    return null;
  }
}

/** Continue Reading's live data, extracted from the section component so
 *  the Home page can fetch it once up front and decide (alongside
 *  Bookmarks) whether to render the shared all-empty state. */
export async function getContinueReadingItems(userId: string): Promise<ProfileContentPreview[]> {
  const rows = await getContinueReading(userId);
  const items = await Promise.all(rows.map(enrichRow));
  return items.filter((item): item is ProfileContentPreview => item !== null);
}

export function ContinueReadingSection({ items }: { items: ProfileContentPreview[] }) {
  if (items.length === 0) return null;

  return (
    <section className={styles.section}>
      <SectionHeading label="Continue Reading" className={styles.sectionHeader} />

      <Carousel gap={16}>
        {items.map((item) => (
          <ContentPreviewCard key={item.href} item={item} />
        ))}
      </Carousel>
    </section>
  );
}
