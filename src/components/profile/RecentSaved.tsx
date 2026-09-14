import { InsightSaveStack, type RecentInsightSave } from "./InsightSaveStack";
import { EpisodeGrid } from "./EpisodeGrid";
import type { BookmarkItem } from "./BookmarksList";
import styles from "./RecentSaved.module.css";

interface RecentSavedProps {
  insightSaves: RecentInsightSave[];
  episodeItems: BookmarkItem[];
  /** Rows the insight carousels above the grid actually take up (0–3) —
   *  drives the grid's own row cap. See EpisodeGrid.module.css. */
  collectionRows: number;
}

/** Home tab's Recently Saved — insight-collection bookmarks render as
 *  full-width bar carousels (resuming at the card the user was on),
 *  deep-dive bookmarks as a responsive portrait grid below. Same two
 *  forms the Insight Cards and Deep Dives tabs use for their own
 *  (uncapped) lists. No type labels, no "View all" link — the section
 *  just ends after the last card. */
export function RecentSaved({ insightSaves, episodeItems, collectionRows }: RecentSavedProps) {
  return (
    <div>
      <InsightSaveStack saves={insightSaves} />
      <div className={insightSaves.length > 0 ? styles.episodeSpacer : undefined}>
        <EpisodeGrid items={episodeItems} collectionRows={collectionRows} />
      </div>
    </div>
  );
}
