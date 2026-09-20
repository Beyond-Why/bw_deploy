"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { InsightCollection } from "@/lib/content";
import { CommentSection, type CurrentUser } from "@/components/comments/CommentSection";
import { InsightCollectionBlock } from "@/components/library/InsightCollectionBlock";
import { ContentPreviewCard, type ProfileContentPreview } from "@/components/ui/ContentPreviewCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { HubRecommendations } from "@/lib/hubRecommendations";
import gridStyles from "@/components/ui/ContentPreviewGrid.module.css";
import styles from "./HubDiscussion.module.css";

const DISCUSSION_VISIBLE_COUNT = 5;
const COLLECTION_VISIBLE_COUNT = 3;

interface HubDiscussionProps {
  seriesSlug: string;
  user: CurrentUser | null;
  collections: InsightCollection[];
  recommendations: HubRecommendations;
}

function CardsSection({ collections }: { collections: InsightCollection[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? collections : collections.slice(0, COLLECTION_VISIBLE_COUNT);
  const hasMore = collections.length > COLLECTION_VISIBLE_COUNT;

  return (
    <div className={styles.block}>
      <SectionHeading label="Insight Collections" className={styles.blockHeading} />
      <div className={styles.cardsList}>
        {visible.map((collection) => (
          <InsightCollectionBlock
            key={collection.slug}
            title={collection.frontmatter.title}
            cards={collection.cards.map((card) => ({
              slug: `${collection.slug}/${card.slug}`,
              href: `/insight-cards/${collection.slug}/${card.slug}`,
              frontmatter: card.frontmatter,
              motif: collection.frontmatter.motif,
            }))}
            quietHeading
          />
        ))}
      </div>
      {hasMore && !expanded && (
        <button type="button" className={styles.showMoreBtn} onClick={() => setExpanded(true)}>
          Show more collections
        </button>
      )}
    </div>
  );
}

/** Hub page's post-episode-list content — a single natural sequence, not
 *  a dropped-in widget: Discussion, then whatever Insight Card collections
 *  exist, then a "Keep Exploring" grid. A thin client wrapper purely
 *  because redirecting to /signin needs a router, which the server-rendered
 *  DeepDiveContent tree above it can't call directly. */
export function HubDiscussion({
  seriesSlug,
  user,
  collections,
  recommendations,
}: HubDiscussionProps) {
  const router = useRouter();
  const pathname = usePathname();
  const discussionRef = useRef<HTMLDivElement>(null);

  const handleRequestAuth = () => {
    router.push(`/signin?next=${encodeURIComponent(pathname)}`);
  };

  // Belt-and-suspenders for #discussion links (see RecentCommentItem's
  // "View discussion"): Next's own Link already scroll-into-views a
  // matching id on navigation, but this container is inside a client
  // component tree, so on a slow/streamed load the browser's native
  // same-document hash jump can fire before it's mounted. Runs once on
  // mount — by then this container (unlike CommentSection's own
  // internal comment list) is always present, even while comments are
  // still loading, since only the *comments themselves* are fetched
  // client-side, not this wrapper. scroll-margin-top (see .discussionContainer)
  // makes both this and the native jump land below the sticky navbar.
  useEffect(() => {
    if (window.location.hash === "#discussion") {
      discussionRef.current?.scrollIntoView({ block: "start" });
    }
  }, []);

  // One flat pool, continue-reading first — no subsection labels. Each
  // card carries its own visual treatment (the progress bar is content on
  // the card, not a section heading), so flattening loses no information.
  const exploreItems: ProfileContentPreview[] = [
    ...recommendations.continueReading,
    ...recommendations.otherDeepDives,
    ...recommendations.relatedEpisodes,
  ];

  return (
    <section className={styles.section}>
      <div className={styles.block}>
        <div id="discussion" ref={discussionRef} className={styles.discussionContainer}>
          <SectionHeading label="Discussion" className={styles.blockHeading} />
          <CommentSection
            seriesId={seriesSlug}
            contentType="series"
            showEpisodeTags
            user={user}
            onRequestAuth={handleRequestAuth}
            initialVisibleCount={DISCUSSION_VISIBLE_COUNT}
          />
        </div>
      </div>

      {collections.length > 0 && <CardsSection collections={collections} />}

      {exploreItems.length > 0 && (
        <div className={collections.length > 0 ? `${styles.block} ${styles.afterCollections}` : styles.block}>
          <SectionHeading label="Keep Exploring" className={styles.blockHeading} />
          <div className={gridStyles.grid}>
            {exploreItems.map((item) => (
              <ContentPreviewCard key={item.href} item={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
