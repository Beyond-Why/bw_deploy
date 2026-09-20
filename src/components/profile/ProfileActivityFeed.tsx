"use client";

import { useCallback, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { OpenBookIcon } from "@/components/icons";
import { EmptyState } from "./EmptyState";
import { RecentSaved } from "./RecentSaved";
import { RecentCommentsList } from "./RecentCommentsList";
import type { RecentInsightSave } from "./InsightSaveStack";
import type { BookmarkItem } from "./BookmarksList";
import type { RecentCommentsPageResult } from "./RecentCommentsSection";
import styles from "./ProfileHomeSection.module.css";

interface ProfileActivityFeedProps {
  insightSaves: RecentInsightSave[];
  episodeItems: BookmarkItem[];
  collectionRows: number;
  initialCommentsPage: RecentCommentsPageResult;
}

/**
 * Coordinates the Home tab's Recently Saved and Recent Comments sections.
 *
 * Requirements:
 * - If Recently Saved has items, render its heading and saved content.
 * - If Recently Saved is empty, completely hide the section (0 layout space).
 * - If Recent Comments has comments, render its heading and comment list.
 * - If Recent Comments is empty, completely hide the section (0 layout space).
 * - If both sections are empty, render one combined empty state with no section headings.
 * - When bookmarks are removed or comments deleted on the client, state updates immediately
 *   without requiring a page reload.
 */
export function ProfileActivityFeed({
  insightSaves,
  episodeItems,
  collectionRows,
  initialCommentsPage,
}: ProfileActivityFeedProps) {
  const [savedCount, setSavedCount] = useState(insightSaves.length + episodeItems.length);
  const [commentCount, setCommentCount] = useState(initialCommentsPage.items.length);

  const handleSavedCountChange = useCallback((count: number) => {
    setSavedCount(count);
  }, []);

  const handleCommentCountChange = useCallback((count: number) => {
    setCommentCount(count);
  }, []);

  const hasSaves = savedCount > 0;
  const hasComments = commentCount > 0;

  if (!hasSaves && !hasComments) {
    return (
      <EmptyState
        icon={<OpenBookIcon size={32} />}
        message="Nothing here yet."
        subMessage="Start reading to see your progress and saves."
        ctaLabel="Explore Deep Dives →"
        ctaHref="/deep-dives"
      />
    );
  }

  return (
    <>
      {hasSaves && (
        <section className={styles.section} id="bookmarks">
          <SectionHeading label="Recently Saved" className={styles.sectionHeader} />
          <RecentSaved
            insightSaves={insightSaves}
            episodeItems={episodeItems}
            collectionRows={collectionRows}
            onCountChange={handleSavedCountChange}
          />
        </section>
      )}
      {hasComments && (
        <section className={styles.section} id="comments">
          <SectionHeading label="Recent Comments" className={styles.sectionHeader} />
          <RecentCommentsList
            initialItems={initialCommentsPage.items}
            initialHasMore={initialCommentsPage.hasMore}
            initialCursor={initialCommentsPage.nextCursor}
            onCountChange={handleCommentCountChange}
          />
        </section>
      )}
    </>
  );
}
