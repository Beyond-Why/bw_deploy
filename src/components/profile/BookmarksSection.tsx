import { getUserBookmarks } from "@/lib/bookmarks";
import { getEpisode, getSeriesIndex } from "@/lib/content";
import { buildInsightSaves } from "./insightSaves";
import { RecentSaved } from "./RecentSaved";
import type { BookmarkItem } from "./BookmarksList";
import { SectionHeading } from "@/components/ui/SectionHeading";
import styles from "./ProfileHomeSection.module.css";

// Each insight-collection bookmark is always exactly one full-width row,
// however many cards it holds — so it's capped by row count, not a card
// count. 3 is the largest row budget any breakpoint allows before the
// episode grid gets zero rows (see EpisodeGrid.module.css), so 3
// collections is the most that could ever be visible anywhere.
const COLLECTION_ROW_CAP = 3;

// How many episode cards to fetch per actual collection-row count —
// the max any breakpoint's row budget could show for that count (3 rows
// at ≥768px, 5 rows below). Index = collectionRows (0–3). Kept in sync
// with the nth-child caps in EpisodeGrid.module.css.
const EPISODE_FETCH_CAP_BY_COLLECTION_ROWS = [15, 10, 6, 4];

/** Bookmarks' live data, extracted from the section component so the
 *  Home page can fetch it once up front (alongside Continue Reading) to
 *  decide on the shared all-empty state, and so the per-type tabs
 *  (Deep Dives / Insight Cards / Builder Logs) can fetch once and filter. */
/** Episode/series bookmark title + thumbnail are re-read from the source
 *  MDX on every request instead of the bookmark row's saved-at snapshot,
 *  so a card always reflects the current title/thumbnail even if the
 *  content was edited after the user bookmarked it. The bookmark row's
 *  own contentTitle/thumbnailUrl columns are left in place (and used as a
 *  fallback if the source file is gone) — only the read path changed. */
async function withFreshEpisodeMetadata(item: BookmarkItem): Promise<BookmarkItem> {
  const [type, seriesSlug, episodeSlug] = item.contentId.split("/");
  if ((type !== "deep-dives" && type !== "builder-log") || !seriesSlug || !episodeSlug) {
    return item;
  }
  try {
    const [{ frontmatter }, seriesData] = await Promise.all([
      getEpisode(type, seriesSlug, episodeSlug),
      getSeriesIndex(type, seriesSlug),
    ]);
    return {
      ...item,
      contentTitle: frontmatter.title,
      thumbnailUrl: frontmatter.thumbnail || seriesData.frontmatter.thumbnail || null,
    };
  } catch {
    // Source file renamed/removed since the bookmark was saved — keep the
    // snapshot rather than breaking the card.
    return item;
  }
}

export async function getBookmarkItems(userId: string): Promise<BookmarkItem[]> {
  const rows = await getUserBookmarks(userId);
  const items = rows.map((row) => ({
    id: row.id,
    contentId: row.contentId,
    contentType: row.contentType,
    contentTitle: row.contentTitle,
    contentUrl: row.contentUrl,
    seriesTitle: row.seriesTitle,
    seriesSlug: row.seriesSlug,
    episodeNumber: row.episodeNumber,
    thumbnailUrl: row.thumbnailUrl,
    activeCardIndex: row.activeCardIndex,
    contentCategory: row.contentCategory,
    createdAt: row.createdAt.toISOString(),
  }));
  return Promise.all(
    items.map((item) =>
      item.contentType === "episode" || item.contentType === "builder-log"
        ? withFreshEpisodeMetadata(item)
        : item
    )
  );
}

export async function BookmarksSection({ items }: { items: BookmarkItem[] }) {
  if (items.length === 0) return null;

  const sorted = [...items].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const collectionCandidates = sorted
    .filter((item) => item.contentType === "insight-collection")
    .slice(0, COLLECTION_ROW_CAP);
  // Built (not just sliced) before sizing the episode fetch below — a
  // candidate collection whose content was since removed from disk drops
  // out here, and the row budget it would've used should go to episodes.
  const insightSaves = await buildInsightSaves(collectionCandidates);
  const collectionRows = insightSaves.length;

  const episodeFetchCap = EPISODE_FETCH_CAP_BY_COLLECTION_ROWS[collectionRows] ?? 0;
  const episodeItems = sorted
    .filter((item) => item.contentType === "episode" || item.contentType === "series")
    .slice(0, episodeFetchCap);

  if (collectionRows === 0 && episodeItems.length === 0) return null;

  return (
    <section className={styles.section} id="bookmarks">
      <SectionHeading label="Recently Saved" className={styles.sectionHeader} />
      <RecentSaved
        insightSaves={insightSaves}
        episodeItems={episodeItems}
        collectionRows={collectionRows}
      />
    </section>
  );
}
