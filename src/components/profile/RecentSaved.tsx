"use client";

import { useCallback, useState } from "react";
import { OpenBookIcon } from "@/components/icons";
import { InsightSaveStack, type RecentInsightSave } from "./InsightSaveStack";
import { EpisodeGrid } from "./EpisodeGrid";
import { EmptyState } from "./EmptyState";
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
 *  just ends after the last card.
 *
 *  A client component (not just the two lists below it) because it has to
 *  know the *combined* remaining count after either list's own X-button
 *  removal — InsightSaveStack and EpisodeGrid each manage their own
 *  filtered-down list internally and simply render nothing once empty, so
 *  without this, removing the very last bookmark left a blank gap under
 *  the "Recently Saved" heading instead of the empty state. */
export function RecentSaved({ insightSaves, episodeItems, collectionRows }: RecentSavedProps) {
  const [saveCount, setSaveCount] = useState(insightSaves.length);
  const [episodeCount, setEpisodeCount] = useState(episodeItems.length);

  const handleSaveCountChange = useCallback((count: number) => setSaveCount(count), []);
  const handleEpisodeCountChange = useCallback((count: number) => setEpisodeCount(count), []);

  if (saveCount === 0 && episodeCount === 0) {
    return (
      <EmptyState
        icon={<OpenBookIcon size={32} />}
        message="Nothing here yet."
        subMessage="Start reading to see your progress and saves."
        ctaLabel="Explore Deep Dives →"
        ctaHref="/deep-dives"
        variant="section"
      />
    );
  }

  return (
    <div>
      <InsightSaveStack saves={insightSaves} onCountChange={handleSaveCountChange} />
      <div className={insightSaves.length > 0 ? styles.episodeSpacer : undefined}>
        <EpisodeGrid
          items={episodeItems}
          collectionRows={collectionRows}
          onCountChange={handleEpisodeCountChange}
        />
      </div>
    </div>
  );
}
